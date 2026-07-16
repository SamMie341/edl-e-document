const fs = require('fs');
const path = require('path');

// List of controllers to parse
const controllers = [
  'src/app.controller.ts',
  'src/modules/department/presentation/controller/department.controller.ts',
  'src/modules/division/presentation/controller/division.controller.ts',
  'src/modules/document/presentation/controllers/document.controller.ts',
  'src/modules/document-borrow/presentation/controllers/document-borrow.controller.ts',
  'src/modules/document-type/presentation/controllers/document-type.controller.ts',
  'src/modules/folder/presentation/controllers/folder.controller.ts',
  'src/modules/locker/presentation/controllers/locker.controller.ts',
  'src/modules/office/presentation/controller/office.controller.ts',
  'src/modules/search/presentation/controllers/search.controller.ts',
  'src/modules/shelf/presentation/controllers/shelf.controller.ts',
  'src/modules/sub-document/presentation/controllers/sub-document.controller.ts',
  'src/modules/unit/presentation/controllers/unit.controller.ts',
  'src/modules/user/presentation/controllers/auth.controller.ts',
  'src/modules/user/presentation/controllers/user.controller.ts',
  'src/modules/warehouse/presentation/controllers/warehouse.controller.ts'
];

const workspaceRoot = __dirname;

function resolveImportPath(controllerPath, importString) {
  const dir = path.dirname(path.join(workspaceRoot, controllerPath));
  if (importString.startsWith('src/')) {
    return path.join(workspaceRoot, importString + '.ts');
  }
  return path.resolve(dir, importString + '.ts');
}

function parseDtoFile(dtoFilePath) {
  if (!fs.existsSync(dtoFilePath)) {
    const rawPath = dtoFilePath.replace('.ts', '');
    if (fs.existsSync(rawPath)) {
      dtoFilePath = rawPath;
    } else {
      return {};
    }
  }

  const content = fs.readFileSync(dtoFilePath, 'utf8');
  const properties = {};
  const lines = content.split('\n');
  let currentClass = false;
  
  for (const line of lines) {
    if (line.includes('class ')) {
      currentClass = true;
      continue;
    }
    if (currentClass) {
      // Matches propertyName: type; or propertyName?: type;
      const propMatch = line.match(/^\s*(\w+)(\?)?\s*:\s*([^;]+);/);
      if (propMatch) {
        const propName = propMatch[1];
        const propType = propMatch[3].trim();
        properties[propName] = propType;
      }
    }
  }
  return properties;
}

function getDummyValueForType(fieldName, type) {
  const lowerFieldName = fieldName.toLowerCase();
  if (lowerFieldName.includes('status')) {
    return 'A';
  }
  
  type = type.toLowerCase();
  if (type.includes('string')) {
    if (lowerFieldName.includes('email')) return 'admin@edl.com.la';
    if (lowerFieldName.includes('empcode')) return 'ADMIN000';
    if (lowerFieldName.includes('password')) return 'EDL1234';
    if (lowerFieldName.includes('date')) return new Date().toISOString();
    if (lowerFieldName.includes('id')) return '1';
    return `${fieldName}_val`;
  }
  if (type.includes('number') || type.includes('int') || type.includes('float')) {
    return 1;
  }
  if (type.includes('boolean')) {
    return false;
  }
  if (type.includes('date')) {
    return new Date().toISOString();
  }
  if (type.includes('array') || type.includes('[]')) {
    return [];
  }
  return {};
}

function parseController(controllerPath) {
  const fullPath = path.join(workspaceRoot, controllerPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Controller file not found: ${fullPath}`);
    return null;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  // Parse imports
  const imports = {};
  const importRegex = /import\s+{([\s\S]+?)}\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[2];
    const namesSegment = match[1];
    const names = namesSegment.split(',').map(n => n.trim().replace(/\s+/g, ' '));
    for (const name of names) {
      imports[name] = importPath;
    }
  }

  // Get base controller route
  const controllerRouteMatch = content.match(/@Controller\(\s*(?:['"`](.*?)['"`])?\s*\)/);
  if (!controllerRouteMatch) {
    return null;
  }
  const basePath = controllerRouteMatch[1] || '';

  // Check class level JwtAuthGuard
  const classHasGuard = content.includes('JwtAuthGuard');

  // Extract endpoints
  const endpoints = [];
  // Correct regex that matches method signatures with inner brackets correctly by capturing up to the closing bracket before the function body opening curly brace '{'
  const methodRegex = /@(Get|Post|Put|Delete|Patch)\s*\(\s*(?:['"`](.*?)['"`])?\s*\)[\s\S]*?(?:async\s+)?(\w+)\s*\(([\s\S]*?)\)(?:\s*:\s*[^{]+)?\s*\{/g;
  
  while ((match = methodRegex.exec(content)) !== null) {
    const httpMethod = match[1].toUpperCase();
    const routePath = match[2] || '';
    const methodName = match[3];
    const paramsString = match[4];

    // Build the request URL path
    let fullRoute = basePath;
    if (routePath) {
      fullRoute = basePath ? `${basePath}/${routePath}` : routePath;
    }
    // Clean double slashes
    fullRoute = fullRoute.replace(/\/+/g, '/').replace(/\/$/, '');

    const queryParams = [];
    const pathParams = [];
    let requestBody = null;

    // Parse parameters
    const paramMatches = paramsString.split(',');
    for (const param of paramMatches) {
      const trimmedParam = param.trim();
      if (!trimmedParam) continue;

      // Extract Query Parameters
      const qMatch = trimmedParam.match(/@Query\(\s*['"`](\w+)['"`]\s*\)/);
      if (qMatch) {
        let defaultValue = "";
        if (trimmedParam.includes('=')) {
          defaultValue = trimmedParam.split('=')[1].trim().replace(/['"`]/g, '');
        }
        queryParams.push({
          key: qMatch[1],
          value: defaultValue,
          description: `Query parameter: ${qMatch[1]}`
        });
      }

      // Extract Path Parameters
      const pMatch = trimmedParam.match(/@Param\(\s*['"`](\w+)['"`]\s*\)/);
      if (pMatch) {
        pathParams.push(pMatch[1]);
      }

      // Extract Body
      const bMatch = trimmedParam.match(/@Body\(\)\s*(\w+)\s*:\s*(\w+)/);
      if (bMatch) {
        const dtoName = bMatch[2];
        const importPath = imports[dtoName];
        if (importPath) {
          const dtoFilePath = resolveImportPath(controllerPath, importPath);
          const properties = parseDtoFile(dtoFilePath);
          const bodyObj = {};
          for (const [propName, propType] of Object.entries(properties)) {
            bodyObj[propName] = getDummyValueForType(propName, propType);
          }
          requestBody = bodyObj;
        } else {
          requestBody = {};
        }
      }
    }

    endpoints.push({
      methodName,
      httpMethod,
      route: fullRoute,
      queryParams,
      pathParams,
      requestBody,
      requiresAuth: classHasGuard || paramsString.includes('Req') || paramsString.includes('req')
    });
  }

  // Get Controller display name
  const controllerClassNameMatch = content.match(/class\s+(\w+Controller)/);
  const name = controllerClassNameMatch ? controllerClassNameMatch[1].replace('Controller', '') : path.basename(controllerPath);

  return {
    name,
    basePath,
    endpoints
  };
}

const postmanCollection = {
  info: {
    name: "EDL E-Document API Collection",
    description: "Auto-generated Postman Collection from NestJS controllers and DTOs.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  item: [],
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:5000/api/v1",
      type: "string"
    },
    {
      key: "baseUrl_prod",
      value: "https://api-edoc.edl.com.la/api/v1",
      type: "string"
    },
    {
      key: "accessToken",
      value: "YOUR_JWT_TOKEN_HERE",
      type: "string"
    }
  ]
};

for (const controller of controllers) {
  const result = parseController(controller);
  if (result && result.endpoints.length > 0) {
    const folder = {
      name: result.name,
      item: []
    };

    for (const ep of result.endpoints) {
      const pathSegments = ep.route.split('/').filter(Boolean);
      const urlVariables = [];

      // Detect path parameters from the route (e.g. "users/:id" -> "id")
      for (const segment of pathSegments) {
        if (segment.startsWith(':')) {
          const varName = segment.substring(1);
          urlVariables.push({
            key: varName,
            value: "1",
            description: `Path variable: ${varName}`
          });
        }
      }

      const request = {
        method: ep.httpMethod,
        header: [
          {
            key: "Content-Type",
            value: "application/json"
          }
        ],
        url: {
          raw: `{{baseUrl}}/${ep.route}`,
          host: ["{{baseUrl}}"],
          path: pathSegments,
          query: ep.queryParams.map(q => ({
            key: q.key,
            value: q.value,
            description: q.description
          })),
          variable: urlVariables
        }
      };

      if (ep.requiresAuth) {
        request.auth = {
          type: "bearer",
          bearer: [
            {
              key: "accessToken",
              value: "{{accessToken}}",
              type: "string"
            }
          ]
        };
      }

      if (ep.requestBody) {
        request.body = {
          mode: "raw",
          raw: JSON.stringify(ep.requestBody, null, 2)
        };
      }

      folder.item.push({
        name: `${ep.httpMethod} /${ep.route || ''} (${ep.methodName})`,
        request: request,
        response: []
      });
    }

    postmanCollection.item.push(folder);
  }
}

const outputPath = path.join(workspaceRoot, 'edl-e-document.postman_collection.json');
fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2), 'utf8');
console.log(`Postman collection generated successfully at: ${outputPath}`);

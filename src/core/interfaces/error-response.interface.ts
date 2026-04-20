export interface ErrorResponse {
    success: boolean;
    timestamp: string;
    path: string;
    error: {
        code: string;
        message: string;
        details?: any;
    };
}
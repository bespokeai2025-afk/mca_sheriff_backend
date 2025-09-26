// ApiResponse.ts

// Define a generic interface for API responses
export interface ApiResponse<T> {
    result: boolean; // Indicates if the operation was successful
    statuscode: number; // HTTP status code
    message: string; // Message providing additional information
    data: T | null; // The data returned by the API, can be null for errors
    pagination?: { // Optional pagination information
        currentPage: number; // Current page number
        totalPages: number; // Total number of pages
        totalItems: number; // Total number of items
        pageSize: number; // Number of items per page
    };
}

// Success and error response methods

// Method to create a successful response with data
export const successWithData = <T>(
    message: string,
    data: T,
    pagination?: { currentPage: number; totalPages: number; totalItems: number; pageSize: number },
    statuscode: number = 200
): ApiResponse<T> => {
    return {
        result: true,
        statuscode,
        message,
        data,
        pagination
    };
};

export interface ApiResponse2<T> {
    result: boolean;
    statuscode: number; // HTTP status code
    message: string;
    data: T | null;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
    };
    unreadCount?: any; // Optional extra data (like readCount, etc.)
}

export const successWithData2 = <T>(
    message: string,
    data: T,
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        pageSize: number;
    },
    unreadCount?: any,
    statuscode: number = 200
): ApiResponse2<T> => {
    return {
        result: true,
        statuscode,
        message,
        data,
        pagination,
        unreadCount,
    };
};

// Method to create an error response with data
export const errorWithData = <T>(
    message: string,
    data: T | null,
    statuscode: number = 500
): ApiResponse<T> => {
    return {
        result: false,
        statuscode,
        message,
        data,
    };
};

// Method to create a successful response without data
export const successWithoutData = <T>(
    message: string,
    statuscode: number = 200
): ApiResponse<T> => {
    return {
        result: true,
        statuscode,
        message,
        data: null,
    };
};

// Method to create an error response without data
export const errorWithoutData = <T>(
    message: string,
    statuscode: number = 500
): ApiResponse<T> => {
    return {
        result: false,
        statuscode,
        message,
        data: null,
    };
};

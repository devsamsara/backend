export interface ServiceResponse<T = any> {
    code: number;
    message: string;
    success: boolean;
    data?: T;
}

export const createServiceResponse = <T = any>(
    code: number,
    message: string,
    success: boolean = true,
    data?: T
): ServiceResponse<T> => {
    return {
        code,
        message,
        success,
        ...(data && { ...data }),
    };
};
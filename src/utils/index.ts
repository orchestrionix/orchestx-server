export function extractJson(data: string): any {
    try {
        return JSON.parse(data);
    } catch (error) {
        throw new Error('Failed to parse JSON');
    }
}
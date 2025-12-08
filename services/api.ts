
// Service to communicate with the AI Core Cloud Function backend
// Project ID: gen-lang-client-0773194496
// Region: us-central1

const CLOUD_FUNCTION_URL = 'https://us-central1-gen-lang-client-0773194496.cloudfunctions.net/aiCoreRouter';

export interface AIResponse {
    data?: any;
    error?: string;
}

/**
 * Calls the central AI Core Router Cloud Function.
 * @param intent The action intent (e.g., 'generate_description', 'add_property')
 * @param payload Data required for the intent
 * @param userRole 'host' | 'guest' | 'agent'
 * @param uid Firebase User ID
 */
export const callAICore = async (
    intent: string, 
    payload: any, 
    userRole: string = 'host', 
    uid: string = 'host1'
): Promise<AIResponse> => {
    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userRole,
                intent,
                payload,
                uid
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("AI Core API Error:", error);
        return { error: error.message || "Network request failed" };
    }
};

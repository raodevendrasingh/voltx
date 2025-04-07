declare module 'cli-markdown' {
    /**
     * Converts markdown text to formatted CLI text
     * @param input - The markdown string to convert
     * @param options - Optional configuration options
     */
    function markdown(input: string, options?: {
        code?: boolean;      // Enable code block formatting
        headingPrefix?: string; // Custom prefix for headings
        bulletPrefix?: string;  // Custom prefix for bullet points
        codePrefix?: string;    // Custom prefix for code blocks
        blockquotePrefix?: string; // Custom prefix for blockquotes
        showLinks?: boolean;    // Show URL links
        preserveNewlines?: boolean; // Preserve original newlines
    }): string;

    export = markdown;
}
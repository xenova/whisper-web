import { pipeline, env } from '@xenova/transformers';

env.cacheDir = './.hf-cache';
env.backends.onnx.wasm.numThreads = 1;

export interface SentimentResult {
    sentiment: 'positive' | 'negative' | 'neutral';
    moodDelta: number;
    scores: {
        positive: number;
        negative: number;
        neutral: number;
    };
    maxScore: number;
    topEmotions: Array<{
        label: string;
        score: number;
    }>;
}

class SentimentAnalyzer {
    private classifier: any = null;
    private modelName = 'Cohee/distilbert-base-uncased-go-emotions-onnx';
    private confidenceThreshold = 0.3;
    
    // Emotion to sentiment mapping
    private positiveEmotions = [
        'joy', 'amusement', 'admiration', 'gratitude', 'love', 
        'caring', 'affection', 'pride', 'relief', 'approval', 
        'excitement', 'optimism', 'desire'
    ];
    
    private negativeEmotions = [
        'anger', 'annoyance', 'disappointment', 'disapproval', 'disgust',
        'sadness', 'fear', 'nervousness', 'embarrassment', 'grief',
        'remorse', 'rage'
    ];

    async initialize() {
        console.log('Loading emotion model...');
        this.classifier = await pipeline('text-classification', this.modelName, { quantized: true });
        console.log('Model loaded successfully');
    }

    async detectSentiment(text: string): Promise<SentimentResult> {
        if (!this.classifier) {
            await this.initialize();
        }

        const raw = await this.classifier(text, { topk: null });
        const scores = Array.isArray(raw[0]) ? raw[0] : raw;
        
        // Aggregate sentiment scores
        let posScore = 0;
        let negScore = 0;
        let neuScore = 0;
        
        for (const { label, score } of scores) {
            const emotion = label.toLowerCase();
            if (this.positiveEmotions.includes(emotion)) {
                posScore += score;
            } else if (this.negativeEmotions.includes(emotion)) {
                negScore += score;
            } else {
                neuScore += score;
            }
        }
        
        // Determine sentiment and mood delta (binary: positive or negative only)
        let sentiment: 'positive' | 'negative' | 'neutral';
        let moodDelta: number;
        
        const maxScore = Math.max(posScore, negScore);
        
        if (posScore >= negScore) {
            sentiment = 'positive';
            moodDelta = 1;
        } else {
            sentiment = 'negative';
            moodDelta = -1;
        }
        
        // Get top emotions for debugging
        const topEmotions = scores
            .map((x: any) => ({ label: x.label.toLowerCase(), score: x.score }))
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 3);
        
        return {
            sentiment,
            moodDelta,
            scores: { positive: posScore, negative: negScore, neutral: neuScore },
            maxScore,
            topEmotions
        };
    }

    async analyzeTranscript(chunks: Array<{ text: string; timestamp: [number, number | null] }>) {
        const results = [];
        for (const chunk of chunks) {
            if (chunk.text.trim()) {
                const sentiment = await this.detectSentiment(chunk.text.trim());
                results.push({
                    ...chunk,
                    sentiment
                });
            }
        }
        return results;
    }
}

// Singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();

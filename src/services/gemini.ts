export interface ProductAnalysisData {
  overview: {
    summary: string;
    launch_year: string;
    origin_country: string;
  };
  specs: Array<{ name: string; value: string }>;
  pros: string[];
  cons: string[];
  competitors: Array<{ name: string; price: string; comparison: string }>;
  verdict: {
    rating: number;
    value_for_money: string;
    recommendation: string;
  };
}

/**
 * Call the Gemini API to analyze a product.
 * Returns a parsed ProductAnalysisData object.
 */
export async function analyzeProductWithGemini(
  product: any,
  apiKey: string
): Promise<ProductAnalysisData> {
  const prompt = `Analyze this product in detail and return a strictly valid JSON response:
Product Name: ${product.name}
Brand: ${product.brand}
Category: ${product.categories?.name || 'N/A'}
Description: ${product.description}
Attributes: ${JSON.stringify(product.attributes || {})}

Return only a JSON object matching this structure:
{
  "overview": {
    "summary": "Short paragraph summarizing the product.",
    "launch_year": "Year of launch or release, or N/A",
    "origin_country": "Country of brand origin or assembly, or N/A"
  },
  "specs": [
    { "name": "Technical Spec Name", "value": "Specification Value" }
  ],
  "pros": ["Pro bullet 1", "Pro bullet 2", "Pro bullet 3"],
  "cons": ["Con bullet 1", "Con bullet 2", "Con bullet 3"],
  "competitors": [
    { "name": "Alternative Product Name", "price": "$Price", "comparison": "Key differentiator or trade-off" }
  ],
  "verdict": {
    "rating": 4.5,
    "value_for_money": "Rating or description of value (e.g. Excellent / Good / Overpriced)",
    "recommendation": "Final purchase recommendation summary."
  }
}

Do not include any markdown formatting tags (like \`\`\`json) or extra text. Return only the raw JSON.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `API request failed with status ${response.status}`);
    }

    const resJson = await response.json();
    const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Try parsing raw JSON, stripping markdown block wrapping if present
    let jsonText = rawText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.substring(7);
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.substring(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.substring(0, jsonText.length - 3);
    }
    jsonText = jsonText.trim();

    const data: ProductAnalysisData = JSON.parse(jsonText);
    
    // Validate required fields and patch if missing
    return {
      overview: {
        summary: data.overview?.summary || 'No overview summary available.',
        launch_year: data.overview?.launch_year || 'N/A',
        origin_country: data.overview?.origin_country || 'N/A'
      },
      specs: Array.isArray(data.specs) ? data.specs : [],
      pros: Array.isArray(data.pros) ? data.pros : [],
      cons: Array.isArray(data.cons) ? data.cons : [],
      competitors: Array.isArray(data.competitors) ? data.competitors : [],
      verdict: {
        rating: typeof data.verdict?.rating === 'number' ? data.verdict.rating : 4,
        value_for_money: data.verdict?.value_for_money || 'Good',
        recommendation: data.verdict?.recommendation || 'No recommendation summary provided.'
      }
    };
  } catch (error: any) {
    console.error('Gemini Analysis error:', error);
    throw new Error(error.message || 'Failed to complete product analysis.');
  }
}

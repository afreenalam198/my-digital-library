let embedderPromise;

export function bookAboutText(book) {
  return [book.blurb, book.genre, book.title, book.author, book.note, book.review]
    .filter(Boolean)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function loadEmbedder(onProgress) {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
      }
      return pipeline("feature-extraction", "onnx-community/all-MiniLM-L6-v2-ONNX", {
        dtype: "q4",
        progress_callback: onProgress,
      });
    })();
    embedderPromise.catch(() => {
      embedderPromise = null;
    });
  }
  return embedderPromise;
}

export async function embedTexts(texts, onProgress) {
  const extractor = await loadEmbedder(onProgress);
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  const width = output.dims[output.dims.length - 1];
  const data = output.data;
  const vectors = [];
  for (let index = 0; index < texts.length; index += 1) {
    vectors.push(Array.from(data.slice(index * width, (index + 1) * width)));
  }
  return vectors;
}

export function cosine(left, right) {
  let sum = 0;
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    sum += left[index] * right[index];
  }
  return sum;
}

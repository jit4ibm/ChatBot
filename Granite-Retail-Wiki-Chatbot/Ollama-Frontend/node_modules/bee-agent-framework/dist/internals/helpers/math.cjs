'use strict';

var errors_cjs = require('../../errors.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new errors_cjs.ValueError("Vectors must have equal length");
  }
  const dot = vecA.reduce((sum, value, index) => sum + value * vecB[index], 0);
  const magA = Math.sqrt(vecA.reduce((sum, value) => sum + value ** 2, 0));
  const magB = Math.sqrt(vecB.reduce((sum, value) => sum + value ** 2, 0));
  if (magA === 0 || magB === 0) {
    throw new errors_cjs.ValueError("Vectors cannot not have zero magnitude");
  }
  return dot / (magA * magB);
}
__name(cosineSimilarity, "cosineSimilarity");
function cosineSimilarityMatrix(matrixA, matrixB) {
  if ((matrixA[0]?.length ?? 0) !== (matrixA[0]?.length ?? 0)) {
    throw new errors_cjs.ValueError("Matrices must have the same number of columns.");
  }
  return matrixA.map((rowA) => matrixB.map((rowB) => cosineSimilarity(rowA, rowB)));
}
__name(cosineSimilarityMatrix, "cosineSimilarityMatrix");

exports.cosineSimilarity = cosineSimilarity;
exports.cosineSimilarityMatrix = cosineSimilarityMatrix;
//# sourceMappingURL=math.cjs.map
//# sourceMappingURL=math.cjs.map
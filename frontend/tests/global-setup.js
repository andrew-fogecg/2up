import { resetReviewArtifacts } from './review-helper.js';

export default async function globalSetup() {
  await resetReviewArtifacts();
}
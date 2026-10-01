import AnalyzeClient from './AnalyzeClient';

/**
 * EDU: Server component to accept URL params and render the AnalyzeClient
 */
export default function AnalyzePage({ params }) {
  return <AnalyzeClient username={params.username} />;
}

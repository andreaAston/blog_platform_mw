import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="container page narrow">
      <h1>404 - Page not found</h1>
      <p>That page does not exist or was moved.</p>
      <p><Link to="/">Back to the home page</Link></p>
    </div>
  );
}

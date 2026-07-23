import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="notfound-code">404</p>
      <h1 className="notfound-title mt-3 text-[32px]">This page isn't in the index.</h1>
      <p className="mt-2 font-body text-[14px] text-slate">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-7">Back to home</Link>
    </div>
  );
}

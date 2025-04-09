
import { useState } from 'react';
import { Image, Video, AudioLines, ListMusic } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import UserMenu from './UserMenu';

const AppHeader = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <header className="bg-inventu-darker p-4 shadow-md relative z-10">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-white text-xl font-bold flex items-center">
            <span className="bg-inventu-blue mr-2 p-1 rounded">AI</span>
            <span>Inventu</span>
          </Link>
          
          <button
            className="ml-4 lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isExpanded ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
        
        <nav
          className={cn(
            "flex-grow lg:flex lg:items-center lg:w-auto w-full",
            isExpanded ? "block" : "hidden lg:block"
          )}
        >
          <ul className="lg:flex lg:flex-grow items-center mt-4 lg:mt-0">
            <li className="block lg:mr-4">
              <Link
                to="/"
                className={cn(
                  "block py-2 px-4 rounded-md transition-colors",
                  location.pathname === "/"
                    ? "bg-inventu-blue text-white"
                    : "text-gray-400 hover:text-white hover:bg-inventu-gray/30"
                )}
              >
                Chat
              </Link>
            </li>
            <li className="block lg:mr-4">
              <Link
                to="/media-gallery"
                className={cn(
                  "block py-2 px-4 rounded-md transition-colors flex items-center",
                  location.pathname === "/media-gallery"
                    ? "bg-inventu-blue text-white"
                    : "text-gray-400 hover:text-white hover:bg-inventu-gray/30"
                )}
              >
                <ListMusic size={18} className="mr-2" />
                Galeria de Mídia
              </Link>
            </li>
          </ul>
          
          <div className="mt-4 lg:mt-0">
            <UserMenu />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default AppHeader;

import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Check, Github, Mail, MessageSquare, Settings } from "lucide-react";
import { Badge } from "../ui/badge";

export type Toolkit = "github" | "slack" | "gmail" | "linear";

export interface ToolkitSelectorProps {
  selectedToolkits: Toolkit[];
  onChange: (toolkits: Toolkit[]) => void;
  disabled?: boolean;
}

export function ToolkitSelector({ selectedToolkits, onChange, disabled = false }: ToolkitSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toolkits: { id: Toolkit; name: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: "github", 
      name: "Github", 
      icon: <Github className="h-4 w-4" />,
      description: "Access repositories, issues, and pull requests"
    },
    { 
      id: "slack", 
      name: "Slack", 
      icon: <MessageSquare className="h-4 w-4" />,
      description: "Send and read messages from Slack channels"
    },
    { 
      id: "gmail", 
      name: "Gmail", 
      icon: <Mail className="h-4 w-4" />,
      description: "Read and send emails through Gmail"
    },
    { 
      id: "linear", 
      name: "Linear", 
      icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 12C2 6.47715 6.47715 2 12 2V12H22C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" fill="currentColor" />
      </svg>,
      description: "Manage issues and projects in Linear"
    },
  ];

  const toggleToolkit = (toolkit: Toolkit) => {
    if (selectedToolkits.includes(toolkit)) {
      onChange(selectedToolkits.filter(t => t !== toolkit));
    } else {
      onChange([...selectedToolkits, toolkit]);
    }
  };

  // Determine if the dropdown should appear above or below based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceAbove = buttonRect.top;
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const dropdownHeight = 280; // Approximate height of dropdown
      
      setShowAbove(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
  }, [isOpen]);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
            >
              <Settings className="h-4 w-4" />
              <span>Toolkits</span>
              {selectedToolkits.length > 0 && (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                  {selectedToolkits.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select which toolkits the agent can access</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <div 
          className={`absolute ${showAbove ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 bg-white rounded-lg shadow-lg border p-1 w-64 z-50 max-h-[280px] overflow-y-auto`}
        >
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-medium border-b sticky top-0 bg-white">
              Available Toolkits
            </div>
            <div className="py-1">
              {toolkits.map((toolkit) => (
                <div 
                  key={toolkit.id} 
                  className={`flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md mx-1 my-0.5 ${
                    selectedToolkits.includes(toolkit.id) ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => toggleToolkit(toolkit.id)}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-md ${
                    selectedToolkits.includes(toolkit.id) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                  }`}>
                    {toolkit.icon}
                  </div>
                  <div className="ml-3 flex-grow min-w-0">
                    <div className="font-medium text-sm">{toolkit.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{toolkit.description}</div>
                  </div>
                  <div className="flex-shrink-0 ml-2 w-5 flex justify-center">
                    {selectedToolkits.includes(toolkit.id) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ToolkitBadges({ toolkits }: { toolkits: Toolkit[] }) {
  if (toolkits.length === 0) return null;

  const toolkitIcons: Record<Toolkit, React.ReactNode> = {
    github: <Github className="h-3 w-3 mr-1" />,
    slack: <MessageSquare className="h-3 w-3 mr-1" />,
    gmail: <Mail className="h-3 w-3 mr-1" />,
    linear: <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12C2 6.47715 6.47715 2 12 2V12H22C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" fill="currentColor" />
    </svg>
  };

  return (
    <div className="flex flex-wrap gap-1">
      {toolkits.map((toolkit) => (
        <Badge key={toolkit} variant="outline" className="text-xs flex items-center bg-primary/5 border-primary/20">
          {toolkitIcons[toolkit]}
          {toolkit.charAt(0).toUpperCase() + toolkit.slice(1)}
        </Badge>
      ))}
    </div>
  );
} 
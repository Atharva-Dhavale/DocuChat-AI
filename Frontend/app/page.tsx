"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Upload, MessageSquare, Loader2, Sun, Moon, Search, 
  Bookmark, Copy, RotateCcw, Download, Trash2, 
  ChevronDown, ChevronUp, RefreshCw, Check,
  Sparkles, FileText, ArrowRight, Inbox, 
  Zap, Shield, Brain, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Message, UploadedFile } from "./types";
import { Progress } from "@/components/ui/progress";

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api';

export default function Home() {
  const [view, setView] = useState<'landing' | 'inbox' | 'chat'>('landing');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailedMode, setIsDetailedMode] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const savedMessages = localStorage.getItem("chatMessages");
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages, mounted]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  };

  const handleFiles = async (uploadedFiles: File[]) => {
    for (const file of uploadedFiles) {
      const fileId = Math.random().toString(36).substring(7);
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: Date.now(),
      };

      setFiles(prev => [...prev, newFile]);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_URL}/upload/`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: "assistant",
          content: `I've processed ${file.name}. How can I help you understand its contents?`,
          timestamp: Date.now(),
          confidence: 100,
        }]);

        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been processed and is ready for analysis.`,
        });

        // Move to chat view after successful upload
        setView('chat');
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const messageId = Math.random().toString(36).substring(7);
    setInput("");
    setMessages(prev => [...prev, {
      id: messageId,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          detailed: isDetailedMode,
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
        confidence: data.confidence || Math.floor(Math.random() * 30) + 70,
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get response from the chatbot.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "The message has been copied to your clipboard.",
    });
  };

  const handleBookmark = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? { ...msg, bookmarked: !msg.bookmarked }
          : msg
      )
    );
  };

  const handleUndo = () => {
    if (files.length > 0) {
      const lastFile = files[files.length - 1];
      setFiles(prev => prev.slice(0, -1));
      toast({
        title: "File removed",
        description: `${lastFile.name} has been removed.`,
      });
    }
  };

  const handleDownloadChat = () => {
    const chatContent = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}\n`)
      .join("\n");
    
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat-history.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredMessages = messages.filter(msg =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  if (!mounted) {
    return null;
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DocuChat AI
              </span>
            </div>
            <Button 
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </nav>

          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chat with your documents using AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Upload your documents and get instant, intelligent responses to your questions
            </p>
            <Button 
              size="lg" 
              onClick={() => setView('inbox')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: "Lightning Fast",
                description: "Get instant answers to your questions about any document"
              },
              {
                icon: <Shield className="w-6 h-6 text-green-500" />,
                title: "Secure & Private",
                description: "Your documents are processed securely and never shared"
              },
              {
                icon: <Brain className="w-6 h-6 text-purple-500" />,
                title: "AI-Powered",
                description: "Advanced AI understands context and provides accurate responses"
              }
            ].map((feature, index) => (
              <Card key={index} className="p-6 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'inbox') {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8"
        onDragEnter={handleDrag}
      >
        <div className="max-w-4xl mx-auto px-4">
          <Card className={cn(
            "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700",
            dragActive && "ring-2 ring-blue-500 transform scale-[1.02]"
          )}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                    <Inbox className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Upload Documents
                  </h1>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>

              <div 
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300",
                  dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 dark:border-gray-600"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                />
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Drop your files here
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    or click to browse
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    Choose Files
                  </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports PDF, DOC, DOCX, and TXT files
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                  <div className="space-y-2">
                    {files.map(file => (
                      <div
                        key={file.id}
                        className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span>{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                          className="hover:bg-white/50 dark:hover:bg-gray-600/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 transition-colors duration-300"
      onDragEnter={handleDrag}
    >
      <div className="max-w-4xl mx-auto px-4">
        <Card className={cn(
          "backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700",
          dragActive && "ring-2 ring-blue-500 transform scale-[1.02]"
        )}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Document Chat
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Search messages..."
                    className="pl-8 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <FileText className="w-4 h-4 mr-2" />
                      Choose Files
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUndo}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Undo Last Upload
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {files.map(file => (
                  <div
                    key={file.id}
                    className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 border border-gray-200 dark:border-gray-600"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>{file.name}</span>
                    <button
                      onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <ScrollArea className="h-[500px] pr-4 rounded-lg" ref={scrollAreaRef}>
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-start gap-4 rounded-lg p-4 group transition-all duration-200",
                      message.role === "assistant"
                        ? "bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                        : "bg-blue-50/50 dark:bg-blue-900/50 backdrop-blur-sm"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === "assistant"
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : "bg-gradient-to-r from-indigo-500 to-blue-500"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <MessageSquare className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(message.content)}
                            className="hover:bg-white/50 dark:hover:bg-gray-700/50"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(message.id)}
                            className="hover:bg-white/50 dark:hover:bg-gray-700/50"
                          >
                            <Bookmark
                              className={cn(
                                "w-4 h-4",
                                message.bookmarked && "fill-current text-yellow-500"
                              )}
                            />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {message.content}
                      </p>
                      {message.role === "assistant" && message.confidence && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={message.confidence} 
                              className="h-1 bg-gray-200 dark:bg-gray-600"
                            />
                            <span className="text-xs text-gray-500">
                              {message.confidence}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDetailedMode(!isDetailedMode)}
                    className="hover:bg-white/50 dark:hover:bg-gray-700/50"
                  >
                    {isDetailedMode ? (
                      <ChevronUp className="w-4 h-4 mr-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-1" />
                    )}
                    {isDetailedMode ? "Detailed" : "Concise"} Mode
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadChat}
                    className="hover:bg-white/50 dark:hover:bg-gray-700/50"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Chat
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessages([])}
                  className="hover:bg-white/50 dark:hover:bg-gray-700/50"
                >
                  Clear Chat
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="flex gap-4">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={files.length === 0 || isLoading}
                  className="flex-1 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                />
                <Button 
                  type="submit" 
                  disabled={files.length === 0 || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
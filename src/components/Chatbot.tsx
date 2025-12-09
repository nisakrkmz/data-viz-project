import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles } from 'lucide-react';
import type { ChatMessage, ChatbotContext } from '../types';
import { generateResponse, quickActions, generateMessageId } from '../utils/chatbotUtils';

interface ChatbotProps {
    context: ChatbotContext;
}

export const Chatbot: React.FC<ChatbotProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: generateMessageId(),
            role: 'bot',
            content: 'Merhaba! Ben Antigravity Manager. Veri görselleştirme konusunda size nasıl yardımcı olabilirim? 😊',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        // Kullanıcı mesajını ekle
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        // Bot yanıtını oluştur
        setTimeout(() => {
            const botResponse = generateResponse(content, context);
            const botMessage: ChatMessage = {
                id: generateMessageId(),
                role: 'bot',
                content: botResponse,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 800);
    };

    const handleQuickAction = (actionId: string) => {
        const action = quickActions.find(a => a.id === actionId);
        if (action) {
            handleSendMessage(action.label);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 btn-primary rounded-full p-4 shadow-2xl group"
                    aria-label="Open chatbot"
                >
                    <div className="relative">
                        <Bot className="w-6 h-6" />
                        <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 px-4 py-2 glass-strong rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <p className="text-sm font-semibold">Antigravity Manager</p>
                        <p className="text-xs text-gray-300">Size nasıl yardımcı olabilirim?</p>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] flex flex-col glass-strong rounded-2xl shadow-2xl animate-scale-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900" />
                            </div>
                            <div>
                                <h3 className="font-bold">Antigravity Manager</h3>
                                <p className="text-xs text-gray-400">Online • Her zaman yardıma hazır</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close chatbot"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'glass border border-white/10'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <p className="text-xs opacity-60 mt-1">
                                        {message.timestamp.toLocaleTimeString('tr-TR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start animate-slide-up">
                                <div className="glass border border-white/10 rounded-2xl px-4 py-3">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    {messages.length <= 2 && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-gray-400 mb-2">Hızlı Eylemler:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.map((action) => (
                                    <button
                                        key={action.id}
                                        onClick={() => handleQuickAction(action.id)}
                                        className="text-left p-2 rounded-lg glass hover:bg-white/10 transition-colors text-xs"
                                    >
                                        <span className="mr-1">{action.icon}</span>
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 px-4 py-3 rounded-xl glass border border-white/10 focus:border-purple-400 focus:outline-none transition-colors"
                            />
                            <button
                                onClick={() => handleSendMessage(inputValue)}
                                disabled={!inputValue.trim()}
                                className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                aria-label="Send message"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

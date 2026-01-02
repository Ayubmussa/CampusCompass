'use client';

import * as React from 'react';
import { getTourRecommendationsAction, saveTourAction, answerLocationQuestionAction, type TourRecommendationState } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Save,
  Sparkles,
  Wand2,
  X,
  Minimize2,
  Maximize2,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import type { Location } from '@/lib/locations';
import type { Place } from '@/lib/places';

type AITourChatbotProps = {
  onStartTour: (locationIds: string[], mapIds?: string[], viewMode?: 'locations' | 'maps' | 'both') => void;
  currentLocation?: Location | null;
  availableLocations?: Location[];
  availablePlaces?: Place[];
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export function AITourChatbot({ onStartTour, currentLocation, availableLocations = [], availablePlaces = [] }: AITourChatbotProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [state, setState] = React.useState<TourRecommendationState>({ recommendations: null, error: null });
  const [isPending, setIsPending] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(() => {
    const welcomeMessage = availablePlaces && availablePlaces.length > 0
      ? `Hi! I can help you learn about places and locations, create personalized tours, or answer any questions. What would you like to know?`
      : 'Hi! I can help you create a personalized tour or answer questions about locations. What would you like to know?';
    return [{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    }];
  });
  const [inputValue, setInputValue] = React.useState('');
  const formRef = React.useRef<HTMLFormElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Detect if input is a question vs tour request
  const isQuestion = (text: string): boolean => {
    const questionWords = ['what', 'where', 'when', 'who', 'why', 'how', 'which', 'is', 'are', 'can', 'does', 'do', 'tell me', 'explain', 'describe'];
    const lowerText = text.toLowerCase().trim();
    return questionWords.some(word => lowerText.startsWith(word) || lowerText.includes('?')) ||
           lowerText.length < 20; // Short inputs are likely questions
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim() || isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue.trim();
    setInputValue('');
    setIsPending(true);

    try {
      // Determine if it's a question or tour request
      if (isQuestion(userInput)) {
        // Handle as Q&A
        const conversationHistory = messages
          .slice(-6) // Last 6 messages for context
          .map(m => ({ role: m.role, content: m.content }));

        const locationContext = currentLocation ? {
          name: currentLocation.name,
          description: currentLocation.description,
          category: currentLocation.category,
          tags: currentLocation.tags,
          openingHours: currentLocation.openingHours,
          contactInfo: currentLocation.contactInfo,
          pricingInfo: currentLocation.pricingInfo,
        } : undefined;

        const questionResult = await answerLocationQuestionAction({
          question: userInput,
          locationContext,
          availableLocations: availableLocations.map(l => l.name),
          availablePlaces: availablePlaces.map(p => `${p.name}${p.description ? ` - ${p.description}` : ''}`),
          conversationHistory,
        });

        setIsPending(false);

        if (questionResult.success && questionResult.data) {
          let response = questionResult.data.answer;
          
          if (questionResult.data.suggestedLocations && questionResult.data.suggestedLocations.length > 0) {
            response += `\n\nYou might also be interested in: ${questionResult.data.suggestedLocations.join(', ')}`;
          }

          if (questionResult.data.followUpQuestions && questionResult.data.followUpQuestions.length > 0) {
            response += `\n\nYou might also ask: ${questionResult.data.followUpQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          // Provide more helpful error messages
          let errorContent = 'Sorry, I couldn\'t answer that question. ';
          if (questionResult.error?.includes('rate limit') || questionResult.error?.includes('quota')) {
            errorContent = 'The AI service is temporarily unavailable due to rate limits. Please try again in a few moments. ';
          }
          errorContent += 'Try asking about locations or requesting a tour.';
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: errorContent,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Handle as tour recommendation
        const formData = new FormData();
        formData.append('interests', userInput);

        const result = await getTourRecommendationsAction(state, formData);
        
        setState(result);
        setIsPending(false);

        if (result.error) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Sorry, I encountered an error: ${result.error}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        } else if (result.recommendations && result.tourName) {
          const locationCount = result.recommendations.locationIds?.length || 0;
          const mapCount = result.recommendations.mapIds?.length || 0;
          let description = `Great! I've created a tour called "${result.tourName}". ${result.tourDescription || 'This tour includes locations that match your interests.'}`;
          
          if (locationCount > 0 && mapCount > 0) {
            description += `\n\nThis tour includes ${locationCount} location${locationCount > 1 ? 's' : ''} and ${mapCount} map${mapCount > 1 ? 's' : ''}.`;
          } else if (locationCount > 0) {
            description += `\n\nThis tour includes ${locationCount} location${locationCount > 1 ? 's' : ''}.`;
          } else if (mapCount > 0) {
            description += `\n\nThis tour includes ${mapCount} map${mapCount > 1 ? 's' : ''}.`;
          }

          description += ' Would you like me to start the tour now?';

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: description,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      setIsPending(false);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleStartTour = () => {
    if (state.recommendations) {
      onStartTour(
        state.recommendations.locationIds,
        state.recommendations.mapIds,
        state.recommendations.viewMode
      );
      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Perfect! Starting your tour now. Enjoy exploring!',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
  };

  const handleSaveTour = async () => {
    if (!state.recommendations || !state.tourName || !state.tourDescription || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save tour. Missing data.' });
      return;
    }

    const result = await saveTourAction({
      name: state.tourName,
      description: state.tourDescription,
      locationIds: state.recommendations.locationIds,
      userId: user.id,
    });

    if (result.success) {
      toast({ title: 'Tour Saved!', description: `"${state.tourName}" has been added to your tours.` });
      const savedMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Tour "${state.tourName}" has been saved to your account!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, savedMessage]);
    } else {
      toast({ variant: 'destructive', title: 'Save Failed', description: result.error });
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg transition-all hover:shadow-xl"
        aria-label="Open AI Tour Chatbot"
      >
        <Wand2 className="h-6 w-6" />
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 opacity-75"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed bottom-20 right-6 z-[100] flex flex-col rounded-xl border-0 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 shadow-2xl transition-all overflow-hidden',
        isMinimized ? 'h-16 w-80' : 'h-[600px] w-96'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-sky-400/10 to-blue-600/10 backdrop-blur-sm px-4 py-3">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-headline font-semibold flex items-center gap-1">
            AI Tour Guide
            <Sparkles className="h-4 w-4 text-sky-500" />
          </h3>
        </motion.div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/50"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-500"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4 bg-gradient-to-b from-transparent to-sky-50/20 dark:to-gray-900/20">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        'max-w-[80%] rounded-xl px-4 py-2 shadow-sm',
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white'
                          : 'bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 border border-gray-200/50 dark:border-gray-600/50'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </motion.div>
                  </motion.div>
                ))}
                {isPending && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-xl bg-white/80 dark:bg-gray-700/80 px-4 py-2 border border-gray-200/50 dark:border-gray-600/50">
                      <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    </div>
                  </motion.div>
                )}
                {state.recommendations && state.tourName && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="space-y-2 rounded-xl border border-sky-200/50 dark:border-sky-700/50 bg-gradient-to-br from-sky-50/80 to-blue-50/80 dark:from-sky-900/20 dark:to-blue-900/20 backdrop-blur-sm p-3 shadow-lg"
                  >
                    <div>
                      <h4 className="font-headline font-semibold text-sm bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">{state.tourName}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{state.tourDescription}</p>
                      {(state.recommendations.locationIds.length > 0 || state.recommendations.mapIds?.length) && (
                        <div className="text-xs text-muted-foreground mt-2 space-y-1">
                          {state.recommendations.locationIds.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>📍</span>
                              <span>{state.recommendations.locationIds.length} location{state.recommendations.locationIds.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {state.recommendations.mapIds && state.recommendations.mapIds.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span>🗺️</span>
                              <span>{state.recommendations.mapIds.length} map{state.recommendations.mapIds.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleStartTour}
                        className="flex-1 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white shadow-md"
                      >
                        Start Tour
                      </Button>
                      {user && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveTour}
                          className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

            {/* Input */}
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4">
              <form ref={formRef} onSubmit={handleFormSubmit}>
                <div className="flex gap-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your interests or ask a question..."
                    rows={2}
                    disabled={isPending}
                    className="resize-none border-gray-200 dark:border-gray-700 focus:border-sky-400 focus:ring-sky-400 bg-white/80 dark:bg-gray-700/80"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        formRef.current?.requestSubmit();
                      }
                    }}
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="submit"
                      disabled={isPending || !inputValue.trim()}
                      size="icon"
                      className="shrink-0 bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white shadow-md disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>
            </div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


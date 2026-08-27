import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Todo {
    id: number;
    text: string;
    completed: boolean;
}

export function TodoPanel() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            try {
                setTodos(JSON.parse(savedTodos));
            } catch (e) {
                console.error('Failed to parse todos', e);
            }
        }
    }, []);

    const saveTodos = (newTodos: Todo[]) => {
        setTodos(newTodos);
        localStorage.setItem('todos', JSON.stringify(newTodos));
    };

    const addTodo = () => {
        if (!input.trim()) return;
        const newTodo: Todo = {
            id: Date.now(),
            text: input.trim(),
            completed: false,
        };
        saveTodos([...todos, newTodo]);
        setInput('');
    };

    const toggleTodo = (id: number) => {
        saveTodos(todos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const removeTodo = (id: number) => {
        saveTodos(todos.filter(todo => todo.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };

    return (
        <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-[#024495] focus-visible:outline-none"
                    placeholder="Add a new task..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <Button 
                    size="icon" 
                    className="h-8 w-8 bg-[#024495] text-white hover:bg-[#024495]/90"
                    onClick={addTodo}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2">
                {todos.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground italic">
                        No tasks yet. Enjoy your day!
                    </p>
                ) : (
                    todos.map((todo) => (
                        <div
                            key={todo.id}
                            className={`group flex items-center justify-between gap-2 rounded-lg border p-2 transition-colors ${
                                todo.completed ? 'bg-muted/50 border-transparent opacity-60' : 'bg-card'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <button 
                                    onClick={() => toggleTodo(todo.id)}
                                    className={`shrink-0 transition-colors ${todo.completed ? 'text-green-500' : 'text-muted-foreground hover:text-[#024495]'}`}
                                >
                                    {todo.completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                </button>
                                <span className={`truncate text-xs ${todo.completed ? 'line-through' : ''}`}>
                                    {todo.text}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeTodo(todo.id)}
                            >
                                <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

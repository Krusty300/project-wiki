import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note } from '@/types';

export interface Task {
  id: string;
  noteId: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
}

export function useTasks(noteId: string) {
  return useLiveQuery(
    () => {
      // Extract tasks from note content
      return db.notes.get(noteId).then(note => {
        if (!note || !note.content) return [];
        
        const tasks: Task[] = [];
        const extractTasksFromContent = (content: any): Task[] => {
          const extractedTasks: Task[] = [];
          
          const processNode = (node: any): void => {
            if (node.type === 'taskList') {
              node.content?.forEach((taskItem: any) => {
                if (taskItem.type === 'taskItem') {
                  const text = taskItem.content?.[0]?.content?.[0]?.text || '';
                  const isCompleted = taskItem.attrs?.checked || false;
                  
                  // Try to extract due date from text
                  const dueDateMatch = text.match(/due:\s*(\d{4}-\d{2}-\d{2})/);
                  const dueDate = dueDateMatch ? new Date(dueDateMatch[1]) : undefined;
                  
                  // Try to extract priority from text
                  let priority: Task['priority'] = 'medium';
                  if (text.toLowerCase().includes('high') || text.includes('!')) {
                    priority = 'high';
                  } else if (text.toLowerCase().includes('low')) {
                    priority = 'low';
                  }
                  
                  extractedTasks.push({
                    id: `${note.id}-${taskItem.content?.[0]?.text || ''}`,
                    noteId,
                    title: text.replace(/due:.*$/, '').trim(),
                    completed: isCompleted,
                    priority,
                    dueDate,
                    createdAt: new Date(),
                    completedAt: isCompleted ? new Date() : undefined,
                  });
                }
              });
            } else if (node.content) {
              node.content.forEach(processNode);
            }
          };
          
          if (content.content) {
            content.content.forEach(processNode);
          }
          
          return extractedTasks;
        };
        
        return extractTasksFromContent(note.content);
      });
    },
    [noteId],
    []
  ) as Task[];
}

export function createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
  return {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date(),
  };
}

export function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  return db.notes.where('id').equals(updates.noteId!).modify(note => {
    if (!note || !note.content) return;
    
    // Update the task in the note content
    const updatedContent = updateTaskInContent(note.content, taskId, updates);
    
    note.content = updatedContent;
    note.updatedAt = new Date();
  }).then(() => {});
}

export function deleteTask(taskId: string): Promise<void> {
  return db.notes.toArray().then(notes => {
    const updatePromises: Promise<number>[] = [];
    
    for (const note of notes) {
      if (!note || !note.content) continue;
      
      const updatedContent = deleteTaskFromContent(note.content, taskId);
      if (updatedContent !== note.content) {
        updatePromises.push(db.notes.update(note.id, {
          content: updatedContent,
          updatedAt: new Date(),
        }));
      }
    }
    
    return Promise.all(updatePromises).then(() => {});
  });
}

// Helper functions to manipulate tasks in note content
function updateTaskInContent(content: any, taskId: string, updates: Partial<Task>): any {
  if (!content || !content.content) return content;
  
  const updatedContent = { ...content };
  
  const processNode = (node: any): any => {
    if (node.type === 'taskList') {
      return {
        ...node,
        content: node.content?.map((taskItem: any) => {
          if (taskItem.type === 'taskItem') {
            const currentText = taskItem.content?.[0]?.content?.[0]?.text || '';
            const currentTaskId = `${taskItem.content?.[0]?.text || ''}`;
            
            if (currentTaskId === taskId) {
              let updatedText = currentText;
              
              // Update completion status
              if (updates.completed !== undefined) {
                const checkbox = updates.completed ? '[x]' : '[ ]';
                updatedText = updatedText.replace(/^\[[x\s]\]/, checkbox);
              }
              
              // Update due date
              if (updates.dueDate) {
                const dueDateStr = updates.dueDate.toISOString().split('T')[0];
                updatedText = updatedText.replace(/due:\s*\d{4}-\d{2}-\d{2}/, `due: ${dueDateStr}`);
              }
              
              // Update priority
              if (updates.priority) {
                let priorityText = '';
                switch (updates.priority) {
                  case 'high': priorityText = ' (high)'; break;
                  case 'low': priorityText = ' (low)'; break;
                  default: priorityText = ' (medium)'; break;
                }
                updatedText = updatedText.replace(/\s*\((high|low|medium)\)/, priorityText);
              }
              
              return {
                ...taskItem,
                content: [{ type: 'text', text: updatedText }]
              };
            }
            
            return taskItem;
          }
          
          return taskItem;
        })
      };
    }
    
    if (node.content) {
      return {
        ...node,
        content: node.content.map(processNode)
      };
    }
    
    return node;
  };
  
  return processNode(updatedContent);
}

function deleteTaskFromContent(content: any, taskId: string): any {
  if (!content || !content.content) return content;
  
  let taskFound = false;
  
  const processNode = (node: any): any => {
    if (node.type === 'taskList' && !taskFound) {
      const updatedContent = {
        ...node,
        content: node.content?.filter((taskItem: any) => {
          if (taskItem.type === 'taskItem') {
            const currentTaskId = `${taskItem.content?.[0]?.text || ''}`;
            if (currentTaskId === taskId) {
              taskFound = true;
              return null; // Remove this task item
            }
          }
          
          return taskItem;
        })
      };
      
      return updatedContent;
    }
    
    if (node.content) {
      return {
        ...node,
        content: node.content.map(processNode)
      };
    }
    
    return node;
  };
  
  return processNode(content);
}

// Task statistics
export function useTaskStats(noteId: string) {
  return useLiveQuery(
    () => {
      return db.notes.get(noteId).then(note => {
        if (!note || !note.content) return {
          total: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        };
        
        const tasks = useTasks(noteId);
        return {
          total: tasks.length,
          completed: tasks.filter(task => task.completed).length,
          pending: tasks.filter(task => !task.completed).length,
          overdue: tasks.filter(task => !task.completed && task.dueDate && task.dueDate < new Date()).length,
        };
      });
    },
    [noteId],
    {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
    }
  );
}

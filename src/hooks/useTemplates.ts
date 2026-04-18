import { useState } from 'react';
import { noteTemplates, createNoteFromTemplate } from '@/lib/templates';
import { Note } from '@/types';

export function useTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  const createNoteFromTemplateId = (templateId: string, folderId?: string | null): Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'> | null => {
    const template = noteTemplates.find(t => t.id === templateId);
    if (!template) return null;

    // Generate note content from template
    const note = createNoteFromTemplate(template, folderId);
    
    // Store template values for future use
    setTemplateValues({});
    
    return note;
  };

  const getTemplateVariables = (templateId: string) => {
    const template = noteTemplates.find(t => t.id === templateId);
    return template?.tags || [];
  };

  return {
    templates: noteTemplates,
    selectedTemplate,
    setSelectedTemplate,
    templateValues,
    setTemplateValues,
    createNoteFromTemplate: createNoteFromTemplateId,
    getTemplateVariables,
  };
}

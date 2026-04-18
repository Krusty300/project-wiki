import { Extension } from '@tiptap/core';
import { Suggestion } from '@tiptap/suggestion';
import { slashCommandSuggestion } from './slash-commands';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion(slashCommandSuggestion),
    ];
  },
});

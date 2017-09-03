'use babel';

import { CompositeDisposable } from 'atom';

export default {

  subscriptions: null,

  activate(state) {
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mdtable:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
  },

  toggle() {
    var editor = atom.workspace.getActiveTextEditor();
    var input = editor.getSelectedText();
    var range = editor.getSelectedBufferRange();

    var lines = input.split('\n');
    if (lines[lines.length - 1] == '') {
      lines.pop();
    }

    if (lines.length < 2) {
      atom.notifications.addWarning('Select 2 or more lines except a border.');
      return;
    }

    // Check if the table has the boarder
    var border = 1;
    var borders = lines[1].split('|');
    if (borders[0]                  == '')  borders.shift();
    if (borders[borders.length - 1] == '')  borders.pop();
    for (var j = 0; j < borders.length; j++) {
      if (borders[j].replace(/^\s+/, '').replace(/\s+$/, '').match(/^:*-+:*$/) == null) {
        border = 0;
      }
    }

    if (lines.length < (2 + border)) {
      atom.notifications.addWarning('Select 2 or more lines except a border.');
      return;
    }

    // Save the space size of head
    var space = lines[0].match(/^\s+/);
    space = (space == null) ? 0 : space[0].length;

    // Divide into words
    var maxcol = 0;
    var maxlen = 0;
    var words = [];
    for (var i = 0; i < lines.length; i++) {
      words[i] = lines[i].split('|');
      for (var j = 0; j < words[i].length; j++) {
        words[i][j] = words[i][j].replace(/^\s+/, '').replace(/\s+$/, '');
        if ((border == 1) && (i == 1)) continue;
        maxlen = (maxlen < words[i][j].length) ? words[i][j].length : maxlen;
      }

      if (words[i][0]                   == '')  words[i].shift();
      if (words[i][words[i].length - 1] == '')  words[i].pop();

      if ((border == 1) && (i == 1)) continue;
      maxcol = (maxcol < words[i].length) ? words[i].length : maxcol;
    }

    // Add the border if the table do not have it
    if (border == 0) {
      var newborder = [];
      for (var j = 0; j < maxcol; j++) {
        newborder.push(':' + '-'.repeat(maxlen) + ':');
      }
      words.splice(1, 0, newborder);
    }
    // Adjust border size
    else {
      for (var j = 0; j < maxcol; j++) {
        if (j < words[1].length) {
          words[1][j] = words[1][j].replace('-'.repeat(words[1][j].length - 2), '-'.repeat(maxlen));
        } else {
          words[1].push(':' + '-'.repeat(maxlen) + ':');
        }
      }
    }

    // Make the aligned table
    var output = '';
    for (var i = 0; i < words.length; i++) {
      output = output + ' '.repeat(space) + '|';
      for (var j = 0; j < maxcol; j++) {
        if (i == 1) {
          output = output + words[i][j];
        } else if (j < words[i].length) {
          output = output + ' ' + words[i][j] + ' '.repeat(maxlen - words[i][j].length + 1);
        } else {
          output = output + ' '.repeat(maxlen + 2);
        }
        output = output + '|';
      }
      output = output + '\n';
    }

    editor.setTextInBufferRange(range, output);
    atom.notifications.addInfo('Aligned the markdown table.');
    return;
  } // toggle
};

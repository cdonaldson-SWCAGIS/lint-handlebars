import { Rule } from './types.js';
import { hbs001 } from './hbs001.js';
import { hbs002 } from './hbs002.js';
import { hbs003 } from './hbs003.js';
import { hbs004 } from './hbs004.js';
import { hbs005 } from './hbs005.js';
import { hbs006 } from './hbs006.js';
import { hbs007 } from './hbs007.js';
import { hbs008 } from './hbs008.js';
import { hbs009 } from './hbs009.js';
import { hbs010 } from './hbs010.js';
import { hbs011 } from './hbs011.js';
import { docx001 } from './docx001.js';
import { docx002 } from './docx002.js';
import { docx003 } from './docx003.js';
import { docx004 } from './docx004.js';

export const allRules: Map<string, Rule> = new Map([
    [hbs001.code, hbs001],
    [hbs002.code, hbs002],
    [hbs003.code, hbs003],
    [hbs004.code, hbs004],
    [hbs005.code, hbs005],
    [hbs006.code, hbs006],
    [hbs007.code, hbs007],
    [hbs008.code, hbs008],
    [hbs009.code, hbs009],
    [hbs010.code, hbs010],
    [hbs011.code, hbs011],
    [docx001.code, docx001],
    [docx002.code, docx002],
    [docx003.code, docx003],
    [docx004.code, docx004],
]);

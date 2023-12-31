#!/usr/bin/env node

import inquirer from 'inquirer';
import { statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { Action, Sure } from './interfaces/enums.js';
import { directory } from './services/where.js';
import { filesToOptions } from './services/files-to-options.js';
import { whatToDo } from './views/what-to-do.js';
import { confirmChoice } from './views/confirm-choice.js';
import { cipherFile } from './services/cipher-file.js';
import { decipherFile } from './services/decipher-file.js';
import { optionsForInquirer } from './config/options-for-inquirer.js';

const dir = directory('.');

const files = dir.filter(f => statSync(f).isFile() && extname(resolve(f)) !== '.crypted');
const options = filesToOptions(files);

const filesCryptit = dir.filter(f => extname(resolve(f)) === '.crypted');
const optionsCryptit = filesToOptions(filesCryptit, '🔐');

(async () => {

    let toDo: Action;
    let isSure: Sure;

    do {
        const askForAction = await whatToDo()
        const confirmation = await confirmChoice(askForAction.action)

        isSure = confirmation.isSure;
        toDo = askForAction.action;

    } while (isSure === Sure.no);


    if (toDo === Action.cipher) {
        const opt = await inquirer.prompt(optionsForInquirer(options));

        if (opt.files.length < 1) {
            console.log(`You haven't chosen any file to ${toDo}`);
            return;
        }

        opt.files.forEach((f: string) => {
            cipherFile(f, opt.password);
        });
    }

    if (toDo === Action.decipher) {
        const opt = await inquirer.prompt(optionsForInquirer(optionsCryptit));

        if (opt.files.length < 1) {
            console.log(`You haven't chosen any file to ${toDo}`);
            return;
        }

        opt.files.forEach((f: string) => {
            decipherFile(f, opt.password);
        });
    }
    return;
})();
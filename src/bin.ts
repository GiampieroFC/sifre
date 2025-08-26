#!/usr/bin/env node
import { isCancel, cancel, text, intro, outro, confirm, groupMultiselect, password, spinner, note } from '@clack/prompts';
import color from 'picocolors';
import { statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { Action } from './interfaces/enums.js';
import { directory } from './services/where.js';
import { filesToOptions } from './services/files-to-options.js';
import { whatToDo } from './views/what-to-do.js';
import { cipherFile } from './services/cipher-file.js';
import { decipherFile } from './services/decipher-file.js';


const canceled = (value: unknown,) => {
    if (isCancel(value)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }
}

const spin = spinner();

(async () => {

    console.clear();

    intro(`${color.bgCyan(color.black(' Sifre, to cipher files '))}`);

    let todo;
    let shouldTodo;

    do {

        todo = await whatToDo();
        isCancel(todo);

        shouldTodo = await confirm({
            message: `Do you want to ${color.green((todo as string).toLocaleUpperCase())}👈?`,
        });

        if (typeof shouldTodo === 'symbol') {
            throw new Error();
        }

    } while (!shouldTodo);


    const pathDir = await text({
        message: `Write relative or absolute path of ${color.green('directory')}`,
        placeholder: "Enter to open here",
        defaultValue: resolve('.'),
    })
    isCancel(pathDir);

    if (todo === Action.cipher) {

        const dir = directory(pathDir.toString());

        const files = dir.filter(f => statSync(f).isFile() && extname(resolve(f)) !== '.crypted');

        const options = filesToOptions(files);

        const selectedFiles = await groupMultiselect({
            message: `Select files to ${color.green((todo as string).toLocaleUpperCase())}`,
            options: {
                'All files': options
            }
        })

        canceled(selectedFiles);

        if ((selectedFiles as string[]).length < 1) {
            console.log(`You haven't chosen any file to ${todo}`);
            process.exit(0);
        }

        note('Don\'t forget your password, the files will need to be decrypted.', color.red('⚠️ Don\'t forget!'))

        const pw = await password({
            message: 'Provide a password',
            mask: '🤐'
        });

        canceled(pw);

        spin.start(`${color.dim('ciphering...')}`);

        (selectedFiles as string[]).forEach((f: string) => {
            cipherFile(f, (pw as string));
        });

        spin.stop(`${color.yellow('👍 Encripted!')}`);
    }

    if (todo === Action.decipher) {

        const dir = directory(pathDir.toString());

        const filesCryptit = dir.filter(f => extname(resolve(f)) === '.crypted');

        const options = filesToOptions(filesCryptit);

        const selectedFiles = await groupMultiselect({
            message: `Select files to ${color.green((todo as string).toLocaleUpperCase())}`,
            options: {
                'All files': options
            }
        })

        canceled(selectedFiles);

        if ((selectedFiles as string[]).length < 1) {
            console.log(`You haven't chosen any file to ${todo}`);
            process.exit(0);
        }

        const pw = await password({
            message: 'Enter the password',
            mask: '🤐',
            validate: (value) => {
                if (!value) return 'Please enter a password.';
                if (value.length < 3)
                    return 'Password should have at least 3 characters.';
            },
        });

        canceled(pw);

        spin.start(`${color.dim('deciphering...')}`);

        try {
            (selectedFiles as string[]).forEach((f: string) => {
                decipherFile(f, (pw as string));
            });
        } catch (error) {
            cancel(`${color.bgWhite(color.red('\n🚨 Oh, oh! Something went wrong, check your password\n'))}`);
            process.exit(0);
        }

        spin.stop(`${color.yellow('👍 Decrypted!')}`);
    }

})()
    .catch(() => {
        cancel('\n🚨 Oh, oh! Something went wrong, execution canceled');
    })
    .finally(() => {
        outro(
            `Problems? ${color.underline(color.cyan('https://github.com/GiampieroFC/sifre'))}`
        );
        process.exit(0);
    });
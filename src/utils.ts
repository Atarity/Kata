import * as path from 'path';
import * as fs from 'fs';

// Transform filename from userinput to Title without dashes
export const fileToTitle = (fileName: string): string => {
    const result = fileName.slice(11,-3);
    return result.charAt(0).toUpperCase() + result.replace(/-/g, ' ').slice(1);
}

export const toLocalTime = () => {
    const d = new Date();
    const offset = (d.getTimezoneOffset() * 60000) * -1;  // Minutes to milliseconds
    // Calculate unix-time for local machine
    return new Date(d.getTime() + offset);
};

// Check user input filename
export const isValid = (() => {
    const rg1=/^[^\\/:\*\?"<>\|\[\]\{\}]+$/; // forbidden and special characters \ / : * ? " < > | [ ] { }
    const rg2=/^\./; // cannot start with dot (.)
    const rg3=/^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names in Win
    return function isValid(fname) {
      return rg1.test(fname)&&!rg2.test(fname)&&!rg3.test(fname);
    }
})();

export const getDirsWithTDMFile = function(dir: string, dirs: string[]) {
    const files = fs.readdirSync(dir);
	dirs = dirs || [];
	files.forEach(function(file) {
        const fullFilePath = path.join(dir, file);
	    if (fs.statSync(fullFilePath).isDirectory()) {
		    dirs = getDirsWithTDMFile(fullFilePath, dirs);
		} else if (file === '.todomator') {
			dirs.push(dir);
		}
    });
	return dirs;
};

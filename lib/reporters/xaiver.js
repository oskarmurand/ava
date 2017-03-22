'use strict';
const path = require('path');
const indentString = require('indent-string');
const prettyMs = require('pretty-ms');
const figures = require('figures');
const chalk = require('chalk');
const plur = require('plur');
const formatAssertError = require('../format-assert-error');
const extractStack = require('../extract-stack');
const codeExcerpt = require('../code-excerpt');

class xavierReporter {
	constructor(options) {
		this.options = Object.assign({}, options);
	}
	start() {
		return '';
	}
	test(test, runStatus) {
		if (test.error) {
			return '  ' + figures.cross + ' ' + test.title + ' ' + test.error.message;
		}

		if (test.todo) {
			return '  ' + '- ' + test.title;
		} else if (test.skip) {
			return '  ' + '- ' + test.title;
		}

		if (test.failing) {
			return '  ' + figures.tick + ' ' + test.title;
		}

		if (runStatus.fileCount === 1 && runStatus.testCount === 1 && test.title === '[anonymous]') {
			return undefined;
		}

		// Display duration only over a threshold
		const threshold = 100;
		const duration = test.duration > threshold ? ' (' + prettyMs(test.duration) + ')' : '';

		return '  ' + figures.tick + ' ' + test.title + duration;
	}
	unhandledError(err) {
		if (err.type === 'exception' && err.name === 'AvaError') {
			return '  ' + figures.cross + ' ' + err.message;
		}

		const types = {
			rejection: 'Unhandled Rejection',
			exception: 'Uncaught Exception'
		};

		let output = `${types[err.type]}: ${err.file} \n`;

		if (err.stack) {
			output += `  ${err.stack}\n`;
		} else {
			output += '  ' + JSON.stringify(err) + '\n';
		}

		output += '\n';

		return output;
	}
	finish(runStatus) {
		let output = '\n';

		const lines = [
			runStatus.failCount > 0 ?
				`  ${runStatus.failCount} ${plur('test', runStatus.failCount)} failed` :
				`  ${runStatus.passCount} ${plur('test', runStatus.passCount)} passed`,
			runStatus.knownFailureCount > 0 ? `  ${runStatus.knownFailureCount} ${plur('known failure', runStatus.knownFailureCount)}` : '',
			runStatus.skipCount > 0 ? `  ${runStatus.skipCount} ${plur('test', runStatus.skipCount)} skipped` : '',
			runStatus.todoCount > 0 ? `  ${runStatus.todoCount} ${plur('test', runStatus.todoCount)} todo'` : '',
			runStatus.rejectionCount > 0 ? `  ${runStatus.rejectionCount} unhandled ${plur('rejection', runStatus.rejectionCount)}` : '',
			runStatus.exceptionCount > 0 ? `  ${runStatus.exceptionCount} uncaught ${plur('exception', runStatus.exceptionCount)}` : '',
			runStatus.previousFailCount > 0 ? `  ${runStatus.previousFailCount} previous ${plur('failure', runStatus.previousFailCount)} in test files that were not rerun` : ''
		].filter(Boolean);

		if (lines.length > 0) {
			lines[0] += ' ' + chalk.gray.dim('[' + new Date().toLocaleTimeString('en-US', {hour12: false}) + ']');
			output += lines.join('\n');
		}

		if (runStatus.knownFailureCount > 0) {
			runStatus.knownFailures.forEach(test => {
				output += `\n\n\n  ${test.title}`;
			});
		}

		if (runStatus.failCount > 0) {
			runStatus.tests.forEach((test, index) => {
				if (!test.error) {
					return;
				}

				const beforeSpacing = index === 0 ? '\n\n' : '\n\n\n\n';
				output += `${beforeSpacing}  ${test.title}\n`;
				if (test.error.source) {
					output += `  ${test.error.source.file}:${test.error.source.line}\n`;

					const errorPath = path.join(this.options.basePath, test.error.source.file);
					const excerpt = codeExcerpt(errorPath, test.error.source.line, {maxWidth: process.stdout.columns});
					if (excerpt) {
						output += '\n' + indentString(excerpt, 2) + '\n';
					}
				}

				if (test.error.showOutput) {
					output += '\n' + indentString(formatAssertError(test.error), 2);
				}

				// `.trim()` is needed, because default `err.message` is ' ' (see lib/assert.js)
				if (test.error.message.trim()) {
					output += '\n' + indentString(test.error.message, 2) + '\n';
				}

				if (test.error.stack) {
					output += '\n' + indentString(extractStack(test.error.stack), 2);
				}
			});
		}

		if (runStatus.failFastEnabled === true && runStatus.remainingCount > 0 && runStatus.failCount > 0) {
			output += `\n\n\n  --fail-fast is on. Any number of tests may have been skippe`;
		}

		if (runStatus.hasExclusive === true && runStatus.remainingCount > 0) {
			output += `\n\n\n  The .only() modifier is used in some tests. ${runStatus.remainingCount} ${plur('test', runStatus.remainingCount)} ${plur('was', 'were', runStatus.remainingCount)} not run`;
		}

		return output + '\n';
	}
	section() {
		return chalk.gray.dim('\u2500'.repeat(process.stdout.columns || 80));
	}
	write(str) {
		console.error(str);
	}
	stdout(data) {
		process.stderr.write(data);
	}
	stderr(data) {
		process.stderr.write(data);
	}
}

module.exports = xavierReporter;

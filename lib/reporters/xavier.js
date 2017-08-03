'use strict';
const stripAnsi = require('strip-ansi');
const util = require('util');
const indentString = require('indent-string');
const xmlEscape = require('xml-escape');


function getSourceFromStack(stack, index) {
	return stack
		.split('\n')
		.slice(index, index + 1)
		.join('')
		.replace(/^\s+ /, '');
};

class xavierReporter {
	constructor() {
		this.i = 0;
	};



	start() {
		return '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="tests">';
	};

	test(test) {
		const output = [];
		// let directive = '';
		// const passed = test.todo ? '1' : '0';
		const failed = test.error ? '1' : '0';
		const duration = test.duration ? test.duration / 1000 : '';

		const skipped = test.skip ? ' skipped="1"' : '';
		const todo = test.todo ? ' todo="1"' : '';
		// const file = test.file ? test.file : '';
		const fullTitle = stripAnsi(test.title);
		const titleArray = fullTitle.split(' ');
		const parent = titleArray[0];
		const subParent = titleArray[2];
		const title = titleArray.pop();

		output.push(
			`<testsuite tests="1" failures="${failed}"${skipped}${todo} errors="0" name="${parent}.${subParent}" time="${duration}" >`,
			indentString(`<testcase name="${title}" time="${duration}" >`, 2)
		);

		if (test.error) {
			output.push(
				indentString('<failure>', 4),
				indentString(`expected: ${stripAnsi(xmlEscape(test.error.values[0].value) || 'missing expected value')}`, 6),
				indentString(`actual: ${stripAnsi(test.error.actual)}`, 6),
				indentString(`assertion: ${stripAnsi(test.error.assertion)}`, 6),
				indentString(`operator: ${stripAnsi(test.error.operator)}`, 6),
				indentString(`durartion: ${stripAnsi(duration)}`, 6),
				indentString(`error: ${stripAnsi(xmlEscape(test.error.stack)).replace(/<anonymous>/gi, "&#060;anonymous&#062;")}`, 6),
				'',
				indentString(`full log: ${xmlEscape(util.inspect(test, false, null)).replace(/<anonymous>/gi, "&#060;anonymous&#062;")}`, 6),
				indentString('</failure>', 4)
			);
		}
		output.push(
			indentString('</testcase>', 2),
			'</testsuite>'
		);
		return output.join('\n');
	}
	unhandledError(err) {
		const output = [
			'<testsuite tests="1" failures="1" errors="1">',
			indentString('<error>', 2),
			err.message
		];
		// AvaErrors don't have stack traces
		if (err.type !== 'exception' || err.name !== 'AvaError') {
			output.push(
				indentString(`name: ${err.name}`, 4),
				indentString(`at: ${getSourceFromStack(err.stack, 1)}`, 4),
				'',
				indentString(`full log: ${util.inspect(err, false, null)}`, 4)
			)
		}
		output.push(
			indentString('</error>', 2),
			'</testsuite>'
		);

		return output.join('\n');
	}
	finish(runStatus) {
		const output = [];
		output.push('</testsuites>');
		return output.join('\n');
	}
	write(str) {
		console.log(str);
	}
	stdout(data) {
		process.stderr.write(data);
	}
	stderr(data) {
		this.stdout(data);
	}
}

module.exports = xavierReporter;

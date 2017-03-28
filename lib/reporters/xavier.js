'use strict';
const format = require('util').format;
const stripAnsi = require('strip-ansi');

// Parses stack trace and extracts original function name, file name and line
function getSourceFromStack(stack, index) {
	return stack
		.split('\n')
		.slice(index, index + 1)
		.join('')
		.replace(/^\s+ /, '');
}

class xavierReporter {
	constructor() {
		this.i = 0;
	}

	start() {
		return '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="tests">';
	}
	test(test) {
		let output = [];
		let directive = '';
		const passed = test.todo ? '1' : '0';
		const failed = test.error ? '1' : '0';
		var duration = test.duration ? test.duration / 1000 : '';

		const skipped = test.skip ? ' skipped="1"' : '';
		const todo = test.todo ? ' todo="1"' : '';
		const file = test.file ? test.file : '';
		const fullTitle = stripAnsi(test.title);
		const titleArray = fullTitle.split(" ");
		const parent = titleArray[0];
		const subParent = titleArray[2];
		const title = titleArray.pop();

		output.push(
			`<testsuite tests="1" failures="${failed}"${skipped}${todo} errors="0" name="${parent}" time="${duration}" >`,
			`  <testcase classname="${subParent}" name="${title}" time="${duration}" >`);

		if (test.error) {
			output.push(
				'    <failure>',
				'      ---',
				'        operator: ' + stripAnsi(test.error.operator),
				'        expected: ' + stripAnsi(test.error.expected),
				'        actual: ' + stripAnsi(test.error.actual),
				'        duration_ms: ' + stripAnsi(duration),
				'        at: ' + getSourceFromStack(test.error.stack, 1).replace(/<\/?[^>]+(>|$)/g, ""),
				`        file: ${file}`,
				'      ...',
				'    </failure>'
			);
		}
		output.push(
			'  </testcase>',
			'</testsuite>');
		return output.join('\n');
	}
	unhandledError(err) {
		const output = [
			`<testsuite tests="1" failures="1" errors="1">`,
			'  <error>',
			`    ${err.message}`,
		];
		// AvaErrors don't have stack traces
		if (err.type !== 'exception' || err.name !== 'AvaError') {
			output.push(
				'  ---',
				'    name: ' + err.name,
				'    at: ' + getSourceFromStack(err.stack, 1),
				'  ...'
			);
		}
		output.push('  </error>',
			'</testsuite>');

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

#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get the package name from command line args
const args = process.argv.slice(2);
const packageArg = args.find((arg) => !arg.startsWith("-"));

if (!packageArg) {
	console.log("To start development server, specify the package name as an argument.");
	console.log("Example: npm run dev inference");
	console.log("\nAvailable packages:");

	// List available packages from the packages directory
	const packagesDir = path.join(__dirname, "..", "packages");
	const packages = fs
		.readdirSync(packagesDir)
		.filter(
			(dir) =>
				fs.statSync(path.join(packagesDir, dir)).isDirectory() &&
				fs.existsSync(path.join(packagesDir, dir, "package.json"))
		);

	packages.forEach((pkg) => {
		try {
			const pkgJson = JSON.parse(fs.readFileSync(path.join(packagesDir, pkg, "package.json"), "utf8"));
			const hasDevScript = pkgJson.scripts && pkgJson.scripts.dev;
			console.log(`- ${pkg}${hasDevScript ? "" : " (no dev script)"}`);
		} catch (e) {
			console.log(`- ${pkg} (error reading package.json)`);
		}
	});

	process.exit(0);
}

// Normalize package name
let packageName = packageArg;
if (!packageName.startsWith("@huggingface/")) {
	packageName = `@huggingface/${packageName}`;
}

try {
	console.log(`Starting dev server for package: ${packageName}`);
	execSync(`npx pnpm --filter ${packageName} run dev`, {
		stdio: "inherit",
		env: process.env,
	});
} catch (error) {
	console.error(`\nError running dev server for ${packageName}:`);

	// Check if the package exists
	const packagesDir = path.join(__dirname, "..", "packages");
	const shortName = packageName.replace("@huggingface/", "");
	const packageDir = path.join(packagesDir, shortName);

	if (!fs.existsSync(packageDir)) {
		console.error(`Package "${shortName}" not found in packages directory.`);
	} else {
		// Check if the package has a dev script
		try {
			const pkgJson = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
			if (!pkgJson.scripts || !pkgJson.scripts.dev) {
				console.error(`Package "${shortName}" exists but doesn't have a dev script.`);
			} else {
				console.error("See error details above.");
			}
		} catch (e) {
			console.error(`Error reading package.json for "${shortName}".`);
		}
	}

	process.exit(1);
}

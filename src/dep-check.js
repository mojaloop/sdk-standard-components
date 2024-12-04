const { exec } = require('child_process');

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error.message); 
            } else {
                resolve(stdout);
            }
        });
    });
}

const dependenciesMap = new Map();
const regex = /(?:@[\w-]+\/)?[\w.-]+@\d{1,3}\.\d{1,3}\.\d{1,3}(?:[-+][\w.-]+)?/g;

async function checkDependency(dependency) {
    if (dependenciesMap.has(dependency)) return; 
    try {
        const output = await execCommand(`npm view ${dependency}`);
        if (output.includes('DEPRECATED')) {
            dependenciesMap.set(dependency, 'DEPRECATED');
        } else {
            dependenciesMap.set(dependency, 'active');
        }
    } catch (error) {
        //console.error(`Error checking dependency ${dependency}:`, error);
        dependenciesMap.set(dependency, 'UNKNOWN'); 
    }
}

async function processLines(lines) {
    for (const line of lines) {
        const trimmedLine = line.trim();
        const matches = trimmedLine.matchAll(regex); 

        for (const match of matches) {
            const dependency = match[0]; 
            //console.log(dependency);
            //console.log(line);
            await checkDependency(dependency); 
        }
    }
}

async function checkDependencies(command) {
    try {
        const stdout = await execCommand(command);
        const lines = stdout.trim().split('\n');
        await processLines(lines);
    } catch (error) {
        //console.error(`Error executing command '${command}':`, error);
        const errorLines = error.toString().trim().split('\n');
        await processLines(errorLines); // Process error lines as well
    }
}

async function runDependencyCheck() {
    console.log('Checking dependencies at root level...');
    await checkDependencies('npm ls');

    let deprecatedFound = false;
    let counter = 0;
    dependenciesMap.forEach((status, dependency) => {
        if (status === 'DEPRECATED') {
            counter++;
            deprecatedFound = true;
            console.log(`${counter}. ${dependency} ${status}`);
        }
    });

    if (deprecatedFound) {
        console.log('\x1b[31mWARNING!! Deprecated results found at root level.\n\x1b[0m');
    } else {
        console.log('\x1b[32mSUCCESS: No deprecated packages found at root level! Congos!!\n\x1b[0m');
    }

    console.log('Checking all dependencies (including transitive)...');
    await checkDependencies('npm ls --all');

    deprecatedFound = false;
    counter = 0;
    dependenciesMap.forEach((status, dependency) => {
        if (status === 'DEPRECATED') {
            counter++;
            deprecatedFound = true;
            console.log(`${counter}. ${dependency} ${status}`);
        }
    });

    

    if (deprecatedFound) {
        console.log('\x1b[31mWARNING!! Deprecated results found in dependencies.\n\x1b[0m');
    } else {
        console.log('\x1b[32mSUCCESS: No deprecated packages found! Congos!!\x1b[0m');
    }

    /*
    counter=0;
    dependenciesMap.forEach((status, dependency) => {
        if (status === "UNKNOWN") {
            counter++;
            deprecatedFound = true;
            console.log(`${counter}. ${dependency} ${status}`);
        }
    });
    console.log("UNKNOWN dependencies");
    */
}

runDependencyCheck();

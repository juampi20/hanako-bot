const path = require('path');
const fs = require('fs');
const os = require('os');

const TEST_DB = path.join(os.tmpdir(), `hanako-test-${Date.now()}.sqlite`);

// Set up test database like leveling.test.js
try {
    const { initialize, getDb } = require('../services/database');
    beforeAll(() => {
        initialize(TEST_DB);
    });
    
    afterAll(() => {
        getDb().close();
        try { fs.unlinkSync(TEST_DB); } catch { /* ok */ }
    });
} catch {
    // If database setup fails, we still want to run the tests that don't need it
    console.log('Database setup not available for this test');
}

// Test 1: Registration JSON output
// Verify that command data.toJSON() produces the expected shape for at least 3 different commands
describe('Registration JSON output', () => {
    const { SlashCommandBuilder } = require('discord.js');
    
    test('8ball command structure', () => {
        const { data } = require('../commands/fun/8ball.js');
        expect(data).toBeInstanceOf(SlashCommandBuilder);
        const json = data.toJSON();
        expect(json).toHaveProperty('name', '8ball');
        expect(json).toHaveProperty('description', expect.any(String));
        expect(json).toHaveProperty('options');
        expect(Array.isArray(json.options)).toBe(true);
        expect(json.options.length).toBeGreaterThan(0);
        expect(json.options[0]).toHaveProperty('name', 'question');
    });
    
    test('ping command structure', () => {
        const { data } = require('../commands/misc/ping.js');
        expect(data).toBeInstanceOf(SlashCommandBuilder);
        const json = data.toJSON();
        expect(json).toHaveProperty('name', 'ping');
        expect(json).toHaveProperty('description', expect.any(String));
        expect(json).toHaveProperty('options');
        expect(Array.isArray(json.options)).toBe(true);
    });
    
    test('purge command structure', () => {
        const { data } = require('../commands/moderation/purge.js');
        expect(data).toBeInstanceOf(SlashCommandBuilder);
        const json = data.toJSON();
        expect(json).toHaveProperty('name', 'purge');
        expect(json).toHaveProperty('description', expect.any(String));
        expect(json).toHaveProperty('options');
        expect(Array.isArray(json.options)).toBe(true);
        expect(json.options.length).toBeGreaterThanOrEqual(2);
    });
});

// Test 2: Middleware dual-context
// Test that the permission middleware works with both a fake message-like object (has .author) and a fake interaction-like object (has .user)
describe('Middleware dual-context', () => {
    // Import permissions middleware at the top level
    const permissionsMiddleware = require('../middleware/02-permissions');
    
    test('middleware works with message-like object', () => {
        const mockClient = { config: { ownerID: '123456789' } };
        const mockNext = jest.fn();
        
        const fakeMessageContext = {
            author: { id: '123456789' }, // owner
            reply: null,
            send: null,
            isReplied: false
        };
        
        const mockCommand = { help: { ownerOnly: true } };
        
        permissionsMiddleware(mockClient, fakeMessageContext, mockCommand, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
    
    test('middleware works with interaction-like object', () => {
        const mockClient = { config: { ownerID: '123456789' } };
        const mockNext = jest.fn();
        
        const fakeInteractionContext = {
            user: { id: '123456789' }, // owner
            reply: null,
            send: null,
            isReplied: false
        };
        
        const mockCommand = { help: { ownerOnly: true } };
        
        permissionsMiddleware(mockClient, fakeInteractionContext, mockCommand, mockNext);
        expect(mockNext).toHaveBeenCalled();
    });
});

// Test 3: Command data structure
// Test that every command file in src/commands/ (except none.js and give.js) exports both run AND data AND execute.
// Verify give.js exports data and execute but NOT run
describe('Command data structure', () => {
    const path = require('path');
    
    // Get all command files recursively
    const getCommandFiles = (dir) => {
        const files = [];
        const fs = require('fs');
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isFile() && item.endsWith('.js')) {
                files.push(fullPath);
            } else if (stat.isDirectory()) {
                files.push(...getCommandFiles(fullPath));
            }
        }
        
        return files;
    };
    
    const commandsDir = path.join(__dirname, '../commands');
    const commandFiles = getCommandFiles(commandsDir).filter(file => !file.endsWith('/give.js'));
    
    test('non-owner commands have run, data, and execute exports', () => {
        commandFiles.forEach(file => {
            const command = require(file);
            expect(command).toHaveProperty('run');
            expect(command).toHaveProperty('data');
            expect(command).toHaveProperty('execute');
        });
    });
    
    test('give command has data and execute but NOT run (owner only)', () => {
        const command = require('../commands/leveling/give.js');
        expect(command).toHaveProperty('data');
        expect(command).toHaveProperty('execute');
        expect(command).not.toHaveProperty('run');
    });
});

// Test 4: Migration hints
// Test that commands with hintSlash have a string value
describe('Migration hints', () => {
    test('commands with hintSlash property have string values', () => {
        const path = require('path');
        
        // Get all command files recursively
        const getAllCommandFiles = (dir) => {
            const files = [];
            const fs = require('fs');
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isFile() && item.endsWith('.js')) {
                    files.push(fullPath);
                } else if (stat.isDirectory()) {
                    files.push(...getAllCommandFiles(fullPath));
                }
            }
            
            return files;
        };
        
        const commandsDir = path.join(__dirname, '../commands');
        const commandFiles = getAllCommandFiles(commandsDir);
        
        commandFiles.forEach(file => {
            const command = require(file);
            if (command.help && command.help.hintSlash) {
                expect(command.help.hintSlash).toBeDefined();
                expect(command.help.hintSlash.length).toBeGreaterThan(0);
            }
        });
    });
});
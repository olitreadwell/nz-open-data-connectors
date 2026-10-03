#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { createNzOpenDataMcpServer } from './nzOpenDataMcpServer.js';

const server = createNzOpenDataMcpServer();
await server.connect(new StdioServerTransport());

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AgentAiService } from './agent-ai.service.js';

describe('AgentAiService', () => {
  let service: AgentAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'aiApiKey') return null; // Test fallback without real API calls
              if (key === 'aiModel') return 'llama-3.3-70b-versatile';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AgentAiService>(AgentAiService);
  });

  it('should generate fallback structured response when API key is not configured', async () => {
    const context = {
      nativeBnbBalance: '3.45',
      assets: [{ symbol: 'BNB', balance: '3.45' }, { symbol: 'USDT', balance: '500.0' }],
      recentTxCount: 12,
    };

    const response = await service.generateResponse('What is my treasury allocation?', context);

    expect(response).toHaveProperty('reply');
    expect(response).toHaveProperty('insights');
    expect(response).toHaveProperty('recommendations');
    expect(response.reply).toContain('Asset breakdown');
    expect(response.insights.length).toBeGreaterThan(0);
  });

  it('should handle anomaly inquiries gracefully with verified data', async () => {
    const context = {
      nativeBnbBalance: '1.2',
      assets: [],
      recentTxCount: 4,
    };

    const response = await service.generateResponse('Are there any suspicious activities?', context);

    expect(response.reply).toContain('recent transactions');
    expect(response.insights[0].type).toBe('BALANCE');
  });
});


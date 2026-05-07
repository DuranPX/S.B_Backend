import { Test, TestingModule } from '@nestjs/testing';
import { RutaNodoService } from './ruta_nodo.service';

describe('RutaNodoService', () => {
  let service: RutaNodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RutaNodoService],
    }).compile();

    service = module.get<RutaNodoService>(RutaNodoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

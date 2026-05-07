import { Test, TestingModule } from '@nestjs/testing';
import { RutaParaderoService } from './ruta_paradero.service';

describe('RutaParaderoService', () => {
  let service: RutaParaderoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RutaParaderoService],
    }).compile();

    service = module.get<RutaParaderoService>(RutaParaderoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

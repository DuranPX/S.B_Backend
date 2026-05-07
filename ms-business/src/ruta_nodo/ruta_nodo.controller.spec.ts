import { Test, TestingModule } from '@nestjs/testing';
import { RutaNodoController } from './ruta_nodo.controller';
import { RutaNodoService } from './ruta_nodo.service';

describe('RutaNodoController', () => {
  let controller: RutaNodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RutaNodoController],
      providers: [RutaNodoService],
    }).compile();

    controller = module.get<RutaNodoController>(RutaNodoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

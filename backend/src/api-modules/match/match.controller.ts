import {
  Body,
  Controller,
  Param,
  Post,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { MatchService } from '../../service-modules/match/providers/match.service.js';
import { StartMatchDto } from './dto/match.dto.js';

@ApiTags('match')
@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post('start')
  async startMatch(@Body() dto: StartMatchDto) {
    return this.matchService.startMatch(dto);
  }

  @Sse(':id/stream')
  stream(@Param('id') id: string): Observable<MessageEvent> {
    return this.matchService.getMatchStream(id);
  }
}

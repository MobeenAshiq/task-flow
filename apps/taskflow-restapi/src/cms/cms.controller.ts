import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { CreateCmsContentDto } from './dto/create-cms-content.dto';
import { UpdateCmsContentDto } from './dto/update-cms-content.dto';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @ApiOperation({ summary: 'Get published CMS content items (public)' })
  @ApiQuery({ name: 'type', required: false, type: String })
  getPublicContent(@Query('type') type?: string) {
    return this.cmsService.getPublicContent(type);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get all CMS content items including unpublished (admin)' })
  @ApiQuery({ name: 'type', required: false, type: String })
  getAllContent(@Query('type') type?: string) {
    return this.cmsService.getAllContent(type);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default CMS content entries' })
  seedDefaults() {
    return this.cmsService.seedDefaults();
  }

  @Get(':idOrKey')
  @ApiOperation({ summary: 'Get single CMS content item by ID or Key' })
  findOne(@Param('idOrKey') idOrKey: string) {
    return this.cmsService.findOne(idOrKey);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a CMS content item' })
  create(@Body() dto: CreateCmsContentDto) {
    return this.cmsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a CMS content item by ID' })
  update(@Param('id') id: string, @Body() dto: UpdateCmsContentDto) {
    return this.cmsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CMS content item by ID' })
  remove(@Param('id') id: string) {
    return this.cmsService.remove(id);
  }
}

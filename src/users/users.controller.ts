import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  update(@Request() req, @Body() body: any) {
    return this.usersService.update(req.user.userId, body);
  }

  @Patch('password')
  changePassword(@Request() req, @Body() body: { oldPassword: string; newPassword: string }) {
    return this.usersService.changePassword(req.user.userId, body.oldPassword, body.newPassword);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.usersService.verify(id);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SignInDTO } from './DTO/sign-in.dto';
import { SignUpDTO } from './DTO/sign-up.dto';

// we use @UseGuards(RolesGuard) on top of the controller so we can use a specific guard
//on top of any method or route we use @Roles() to determine the roles allowd to use this specific routes so both are used for
//difiiernete purposes

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDTO): Promise<{ access_token: string }> {
    const user = await this.usersService.findbyEmail(signInDto.email); //we store the user in this variable

    if (!user || user.passwordHash !== signInDto.passwordHash) {
      throw new UnauthorizedException(); //just validating
    }
    const payload = { sub: user.userId, username: user.fullName };
    return { access_token: await this.jwtService.signAsync(payload) }; //this is what we combine with the jwt secret key as our token
    //its an object that has the key access_token with the value of a promise
    // const {password , ...result} = user; //restructuring
  }

  async signup(signUpDto: SignUpDTO): Promise<any> {
    const user = await this.usersService.create({
      ...signUpDto,
      email: signUpDto.email,
      roleId: signUpDto.role,
      passwordHash: signUpDto.passwordHash,
      userId: '6', //implement a way to assign ids
      fullName: signUpDto.userName,
      isActive: true,
    });
    return user;
  }
}

// signIn Done
// signUp/register Done

// forgotPassword
// resetPassword
// token generation/verification

const { Users } = require('../../models/index');
const { updateUserPassword } = require('./user-helper');
const { generateSalt, generatePasswordHash } = require('./password-helper');

module.exports = class Migration {
  constructor(data) {
    this.authUser = data.authUser;
    this.customerData = data.customerData;
    this.data = data.data;
  }

  async generatePassword() {
    const generatedSalt = await generateSalt();
    const generatedPasswordHash = await generatePasswordHash({
      salt: generatedSalt,
      password: this.data.body.password,
    });
    await updateUserPassword({
      id: this.authUser.id,
      salt: generatedSalt,
      passwordHash: generatedPasswordHash,
    });
  }

  async syncMembershipId() {
    await Users.update(
      {
        membershipId: this.customerData.id,
        updatedBy: this.customerData.id,
      },
      {
        where: { username: this.data.body.username },
      }
    );
    return true;
  }
};

import bcrypt from 'bcryptjs'
import log from 'chalk-console'
import jwt from 'jsonwebtoken'
import {cloneDeep} from 'lodash'
import moment from 'moment'
import {
  sendEmail as transportEmail
} from '../../email/mailer'
import mustAuthenticate from '../../../shared/enforce-session'

import staticConfig from '../../../shared/config'

const sendEmail = async (locals, {template}) => {
  if (!locals.email) {
    throw new Error('No email address defined in locals')
  }
  if (!locals.user || !locals.oldUser) {
    throw new Error('Locals must include an oldUser and a user object')
  }

  const config = await staticConfig()
  const token = jwt.sign({
    'email': locals.email
  }, config.get('keypair.clientprivate'), {
    'expiresIn': '1d',
    'issuer':    config.get('domain'),
    'algorithm': 'HS256'
  })

  let link = `https://openusercss.org/verify-email/${token}`

  if (process.env.NODE_ENV === 'development') {
    link = `http://localhost:5010/verify-email/${token}`
  }

  const result = await transportEmail({
    'to':     locals.email,
    'locals': {
      ...locals,
      link
    },
    template
  })

  return result
}

/*
 * Possible actions:
 *   Password reset
 *   Changing e-mail
 *   Changing username
 *   Changing bio
 */

export default async (root, {token, email, password, displayname, bio}, {User, Session}) => {
  const session = await mustAuthenticate(token, Session)
  const config = await staticConfig()
  const {user} = session
  const oldUser = cloneDeep(user)
  const saltRounds = parseInt(config.get('saltRounds'), 10)

  // Password resets
  if (password) {
    const salt = await bcrypt.genSalt(saltRounds)
    const hash = await bcrypt.hash(password, salt)

    user.password = hash

    sendEmail({
      user,
      oldUser,
      'email': user.email
    }, {
      'template': 'password-changed'
    })
    .catch(log.error)
  }

  // Username changing
  if (displayname) {
    if (user.displayname === displayname) {
      throw new Error('This username is already the one you\'re currently using.')
    }

    user.displayname = displayname
    user.username = displayname.toLowerCase()

    sendEmail({
      user,
      oldUser,
      'newDisplayname': displayname,
      'email':          user.email
    }, {
      'template': 'username-changed'
    })
    .catch(log.error)
  }

  // E-mail address changing
  if (email) {
    if (user.email === email) {
      throw new Error('This e-mail address is already the one you\'re currently using')
    }

    user.pendingEmail = email
    user.emailVerified = false

    const verificationToken = jwt.sign({
      email
    }, config.get('keypair.clientprivate'), {
      'expiresIn': '1d',
      'issuer':    config.get('domain'),
      'algorithm': 'HS256'
    })
    let link = `https://openusercss.org/verify-email/${verificationToken}`

    if (process.env.NODE_ENV === 'development') {
      link = `http://localhost:5010/verify-email/${verificationToken}`
    }

    sendEmail({
      'email': user.email,
      user,
      oldUser
    }, {
      'template': 'email-reverification-previous'
    })
    .catch(log.error)

    sendEmail({
      user,
      oldUser,
      email,
      link
    }, {
      'template': 'email-reverification-next'
    })
    .catch(log.error)
  }

  if (bio) {
    user.bio = decodeURIComponent(bio)
  }

  user.lastSeen = moment().toJSON()
  user.lastSeenReason = 'changing account details'
  return user.save()
}

import {cloneDeep} from 'lodash'
import {getFullUser} from './helpers/remotes/queries'
import db, {upsert} from '../db'

export default async ({commit, getters}, id) => {
  commit('loading', true)

  try {
    const themes = db.getCollection('themes')
    const users = db.getCollection('users')
    const {data} = await getFullUser(id)
    const {user} = cloneDeep(data)

    if (user.themes.length) {
      user.themes.forEach((theme, index) => {
        if (theme && theme._id) {
          const constructedTheme = {
            ...theme,
            'user': {
              '_id': user._id
            }
          }

          upsert(themes, constructedTheme)
        }
      })
    }

    const userThemeRefs = []

    user.themes.forEach((theme) => {
      if (theme && theme._id) {
        userThemeRefs.push({
          '_id': theme._id
        })
      }
    })

    user.themes = userThemeRefs

    upsert(users, user)
    commit('loading', false)
    commit('actionError', null)
    return {
      ...user,
      'themes': userThemeRefs
    }
  } catch (error) {
    commit('loading', false)
    commit('actionError', error)
  }
}

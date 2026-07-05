import { PushTokenService } from '../services/push.token.service';
import { GraphQLContext } from '../middlewares/context';

// ===== QUERY RESOLVERS ========
export const isPushTokenEnabled = async (
  _: any,
  args: any,
  context: GraphQLContext
) => {
  const { em, user } = context;
  const { token } = args;

  const pushTokenService = new PushTokenService(em);
  return pushTokenService.isPushTokenEnabled(user, token);
};
// ===== MUTATION RESOLVERS =====

export const registerPushToken = async (
  _: any,
  args: any,
  context: GraphQLContext
) => {
  const { em, user } = context;
  const { token, platform } = args; // ← añadir platform

  const pushTokenService = new PushTokenService(em);
  return pushTokenService.registerToken(user, token, platform);
};

export const togglePushToken = async (
  _: any,
  args: any,
  context: GraphQLContext
) => {
  const { em, user } = context;
  const { token, enabled } = args;

  const pushTokenService = new PushTokenService(em);
  return pushTokenService.togglePushToken(user, token, enabled);
};


export const sendNotification = async (
  _: any,
  args: any,
  context: GraphQLContext
) => {
  const { em, user } = context;
  const { notification } = args;
  const { body, title, forAll } = notification;

  const pushTokenService = new PushTokenService(em);
  return await pushTokenService.sendNotification(user, title, body, forAll);
};

export const removePushToken = async (
  _: any,
  args: any,
  context: GraphQLContext
) => {
  const { em, user } = context;
  const { token } = args;

  const pushTokenService = new PushTokenService(em);
  return await pushTokenService.removePushToken(user, token);
};

// ===== EXPORT RESOLVERS =====

export const pushTokenResolvers = {
  Query: {
    isPushTokenEnabled
  },
  Mutation: {
    registerPushToken,
    sendNotification,
    removePushToken,
    togglePushToken,
  },
};

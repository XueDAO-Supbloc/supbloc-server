const local = true;

export const keyfilepath = local ? './ephemeral-key-pairs.json' : '/tmp/ephemeral-key-pairs.json';
export const accountfilepath = local ? './account.json' : '/tmp/account.json';

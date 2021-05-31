
# Walkthrough for creating React frontend with NodeJS backend

The app was developed on Ubuntu 18.04 machine.

## Create react app

Download `nodejs` and `npm` commands.

Run
```shell
npx create-react-app <app-name> --template typescript
cd <app-name>
npm install
npm start
```

Increase inotify file watchers if you get the following error
> Error: ENOSPC: System limit for number of file watchers reached

```shell
sudo sysctl fs.inotify.max_user_watches=524288
```

**Note**: the above command works until reboot

Packages 
```
npm install --save react-router-dom mongodb express mongodb-client-encryption mongoose
npm install --save-dev @types/react-router-dom @types/express @types/mongodb @types/mongoose concurrently
```


### Quirks

- Component names must start with a capital letter to differentiate HTML tags from the component name.
- `class` to `className` inside JSX
- Use camel case, e.g. `background-color` to `backgroundColor`
- To add custom attribute, use prefix `data-`, e.g. `<div data-myAttr=3>`

## MongoDB

Add admin user using `mongo` command interface
```
$ mongo
> use admin
> db.createUser(
  {
    user: "myUserAdmin",
    pwd: passwordPrompt(), // or cleartext password below version 4.2
    roles: [ { role: "userAdminAnyDatabase", db: "admin" }, "readWriteAnyDatabase" ]
  }
)
```

Enable authentication and restart `mongodb` service with `systemctl restart mongodb`

```
# /etc/mongodb.conf

auth=true
```

Authenticate using command line options
```shell
$ mongo --authenticationDatabase 'admin' -u 'adminuser' -p
```

Create restricted user
```mongodb
> use bookmarks
> db.createUser({
    user: 'bookmarker',
    pwd: 'password',
    roles: [
        {role: 'readWrite', db: 'bookmarks'}
    ]
})
```

Then authenticate using the new user
```shell
$ mongo --authenticationDatabase 'bookmarks' -u 'bookmarker' -p
```

## Create NodeJS backend with Express

Install `express` for backend API calls. `cors` is needed to make cross-origin requests work because during development React different port number than the backend.

```
mkdir bookmarkShare
cd bookmarkShare
npm install --save express cors nodemon mongoose
```

**Note**: `--save` option adds package as a dependency on `package.json` file. While `--save-dev` for non-build environment, so these packages are not present in `npm build`.

Create `.gitignore` file

```
# .gitignore

node_modules
```


For easier deployment either move React frontend to a subfolder or create new React app in the subfolder; `--template typescript` is optional.
```
npx create-react-app client --template typescript
```


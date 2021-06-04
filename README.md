
# Walkthrough for creating React frontend with NodeJS backend

The app was developed on Ubuntu 18.04 machine. 

Source: https://medium.com/weekly-webtips/create-and-deploy-your-first-react-web-app-with-a-node-js-backend-ec622e0328d7

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
package-lock.json
```


For easier deployment either move React frontend to the subfolder, .e.g `bookmarkShare/client`.

### dotenv

Install `dotenv` package
```
npm install --save dotenv
```

Create `.env` file at project root directory; this where we keep API keys.
```
# .env
MONGODB_URI='mongodb://user:password@localhost:27017/bookmarksdb'
```

Initially add `.env` file without credentials to git, then ignore changes to it by adding it to `.gitignore` and running the following command,

```shell
git add .env
git commit -m 'Added .env file'
git update-index --assume-unchanged .env
```

For continuous delivery, the better option is to create environment variable on the server side and use it in the application.


That can be done via [Configuration under Environments on AWS Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environments-cfg-softwaresettings.html#environments-cfg-softwaresettings-console). The environment variable is not visible to a user, so it can't be accessed via EC2 console because the environment variable is directly passed to the launching `npm start` command.

### Build Docker container (Optional)

Create `Dockerfile` at the project root directory,
```
# Dockerfile
FROM  node:alpine

RUN mkdir -p /usr/src/bookmarkShare
WORKDIR /usr/src/bookmarkShare
COPY . /usr/src/bookmarkShare/

EXPOSE 3000/tcp

RUN npm ci --only=production

CMD ["npm", "run", "server:production"]
```

Then run build, the default file is `./Dockerfile`
```
docker build -t bookmarkshare .
```

Then run to test it
```
docker run -p 80:3000 bookmarkshare
```

## Deploy

We can either build static files locally and push to the git repo or let AWS build it for us. The latter allows to keep the repo clean and reduces its size.

If you already pushed `build` files, then overwrite history with. The following command will delete `client/build` from git history and local files as well
```
git filter-branch --tree-filter "rm -rf client/build" --prune-empty HEAD
```

You will need to force change to push remote
```
git push -f origin master
```

### AWS Beanstalk

Based on logs, the default port is 8080 which gets routed to port 80 for public access
```
/var/log/web.stdout.log
----------------------------------------
Jun  3 19:37:43 ip-172-31-5-220 web: > Elastic-Beanstalk-Sample-App@0.0.1 start /var/app/current
Jun  3 19:37:43 ip-172-31-5-220 web: > node app.js
Jun  3 19:37:43 ip-172-31-5-220 web: Server running at http://127.0.0.1:8080/
```

Create zip file using git for manual upload to Beanstalk. Make sure to not include root directory!
```
git archive --format=zip HEAD > app.zip
```

AWS Beanstalk automatically stars the application with `npm start` command. If you need to apply changes that you made on the server, kill `node` process and it will be automatically restarted,

```
sudo pkill -f node
```

The unzipped application is stored on `/var/app/current/`.

To directly connect to AWS Beanstalk terminal, create key pair on Configuration under application environment. Then use the key to connect,

```
ssh -o 'IdentitiesOnly yes' -i ~/Downloads/key.pem ec2-user@18.444.161.48
```
We use `-o` options so that only the specified key is used, otherwise AWS will drop multiple attemps to authenticate. Also use IP address to avoid DNS issues.

**Note**: When connecting to the EC2 instance via browser the user is can be `root`, but for ssh connection it is `ec2-user`.

#### AWS CodePipeline

Add github as a source for Codepipeline. When specifying buildspec leave the field empty so by default it looks for `buildspec.yml` at the project root directory.

The `install` commands are run before `build`. The `artifacts` indicates which files to save and deploy after build is finished. The artifacts files are placed under `/var/app/current/` (older content is removed) on AWS EC2 server, and launched with `npm start`.

```
# buildspec.yml
version: 0.2

phases:
  install:
    commands:
      - echo Installing backend modules...
      - npm ci --only=production
      - echo Install frontend modules...
      - cd client && npm ci
  build:
    commands:
      - echo Building static files for client...
      - npm run build
artifacts:
  files:
    - ./*
    - node_modules/**/*
    - client/build/**/*
```

**Note**: `**/*` means to recursively select all files

If you get the following error, then change the version line to `version: 0.2` on `buildspec.yml`.
```
[Container] 2021/06/03 06:13:19 YAML location is /codebuild/output/src233444839/src/buildspec.yml
[Container] 2021/06/03 06:13:19 Phase complete: DOWNLOAD_SOURCE State: FAILED
[Container] 2021/06/03 06:13:19 Phase context status code: YAML_FILE_ERROR Message: invalid buildspec `version` specified: 1.0, see documentation
```

As an additional touch, change title of the website in `public/index.html` and `public/manifest.json` and replace `favicon.ico`.
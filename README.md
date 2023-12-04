# Cocos2dxInsperctor
修改AppDelegate.cpp代码，并且自行处理一下自己代码适配和设置win32窗口大小的地方
```#if WIN32 // 头文件添加
#include "CCIMGUIGLViewImpl.h"
#include "CCImGuiLayer.h"
#endif
        auto glview = director->getOpenGLView();
        if (!glview) {
#ifdef WIN32
                glview = IMGUIGLViewImpl::createWithRect("Enclose Cat", Rect(0, 0, 960, 640));
#else
                glview = GLViewImpl::create("Enclose Cat");
#endif
                director->setOpenGLView(glview);
        }
#ifdef WIN32
        // Show_ALL是为了节点树的页面不要遮挡游戏页面
        Director::getInstance()->getOpenGLView()->setDesignResolutionSize(720.0f, 1600.0f, ResolutionPolicy::SHOW_ALL);
        //设置win32模拟器大小
        glview->setFrameSize(1200, 800); //600.0f, 800.0f   450.0f, 800.0f    450.0f, 900.0f
        director->getScheduler()->schedule([=](float dt) {
                auto runningScene = Director::getInstance()->getRunningScene();
                if (runningScene && !runningScene->getChildByName("ImGUILayer")) {
                        runningScene->addChild(ImGuiLayer::create(), INT_MAX, "ImGUILayer");
                }
        }, this, 0, false, "checkIMGUI");
#endif
```

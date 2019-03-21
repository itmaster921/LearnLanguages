package com.learnlanguages;

import javax.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import android.os.Bundle;
import android.content.Intent;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "LearnLanguages";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Nullable
            @Override
            protected Bundle getLaunchOptions() {
                Bundle extras = MainActivity.this.getIntent().getExtras();

                Bundle bundle = new Bundle();
                bundle.putString("message", "Hello world from Android Native");
                if(extras != null) {
                    String videoUrl = extras.getString(Intent.EXTRA_TEXT);
                    bundle.putString("videoUrl", videoUrl);
                }
                return bundle;
            }
        };
    }
}
